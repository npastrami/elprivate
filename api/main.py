from quart import Quart, request, jsonify, Response, send_file
from quart_cors import cors
from werkzeug.utils import secure_filename
from dap.azure.uploader import Uploader
from dap.azure.extractor import Extractor
from azure.storage.blob.aio import BlobServiceClient
import dap.credentials as credentials 
import aiofiles
from io import BytesIO
from dap.csv.copyfunc import copy_worksheet
from database.dapdatabase import DapDatabase
from database.accountdatabase import AccountDatabase
from dap.csv.FOFexport import process_FOF
from dap.azure.sorter import Sorter
from dap.form_mapping_utils import upload_bucket_mapping
from database.ui_table_builder import TableBuilder
import xml.etree.ElementTree as ET
import re
import asyncio
import openpyxl
import io
from tortoise import Tortoise, run_async
from tortoise.transactions import in_transaction
from accounts.models.index import TORTOISE_ORM
import accounts.models.index as modelIndex
from accounts.models.role_model import Role
from accounts.routes.auth_routes import auth_routes
from accounts.routes.user_routes import user_routes
from accounts.controllers.user_controller import user_controller

app = Quart(__name__)
# Enable CORS for all routes and origins
app = cors(app, allow_origin="http://localhost:8081", allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])
app.register_blueprint(auth_routes)
app.register_blueprint(user_routes)
app.register_blueprint(user_controller, url_prefix='/api', allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

db_instance = None

@app.before_serving
async def init():
    global db_instance
    print("starting init")
    await Tortoise.init(config=modelIndex.TORTOISE_ORM)
    await Tortoise.generate_schemas(safe=True)
    db_instance = AccountDatabase(user="postgres", password="newpassword", database="accountdatabase", host="127.0.0.1")
    await db_instance.create_pool()

    await initial()

async def initial():
    # skip if already exists
    if await Role.exists():
        return
    await Role.create(id=1, name="user")
    await Role.create(id=2, name="moderator")
    await Role.create(id=3, name="admin")


@app.route('/api/process_doc', methods=['POST'])
async def process_doc():
    form = await request.form
    client_id = form['clientID']
    version_id = form['versionID']
    form_types = form.getlist('formTypes[]')
    uploaded_files = (await request.files).getlist('files[]')

    tasks = []

    for uploaded_file, form_type in zip(uploaded_files, form_types):
        tasks.append(handle_file(client_id, uploaded_file, form_type, version_id))

    responses = await asyncio.gather(*tasks)

    return jsonify(responses)

async def handle_file(client_id, uploaded_file, form_type, version_id):
    filename = secure_filename(uploaded_file.filename)
    blob_url = await upload_file(client_id, uploaded_file, form_type, version_id)

    if not blob_url:
        return {"status": "Error", "error": "Upload failed"}

    if form_type != 'None':
        xml_str = await extract_data(client_id, filename, upload_bucket_mapping[form_type], form_type, version_id)
        if xml_str:
            return {"status": "Extract Completed", "xml": xml_str}
        else:
            return {"status": "Empty Extraction"}
    else:
        return {"status": "Upload Completed", "uploaded_file": blob_url}

async def upload_file(client_id, uploaded_file, form_type, version_id):
    bucket_name = upload_bucket_mapping.get(form_type, 'unsorted')
    uploader = Uploader(bucket_name)
    blob_url = await uploader.upload(client_id, uploaded_file)
    if blob_url:
        database = DapDatabase(client_id, blob_url)
        await database.post2postgres_upload(client_id, blob_url, 'uploaded', form_type, bucket_name, version_id)
    return blob_url

async def extract_data(client_id, filename, bucket_name, form_type, version_id):
    sanitized_blob_name = sanitize_blob_name(filename)
    extractor = Extractor(bucket_name)
    extracted_values, blob_sas_url = await extractor.extract(client_id, sanitized_blob_name, form_type)
    await extractor.update_database(client_id, blob_sas_url, filename, form_type, extracted_values, version_id)
    root = ET.Element("W2s")
    for extracted_value in extracted_values:
        w2_element = ET.SubElement(root, "W2")
        for key, value in extracted_value.items():
            if key == 'confidence':
                w2_element.set('confidence', str(value))
            else:
                ET.SubElement(w2_element, key).text = str(value) if value is not None else None
    xml_str = ET.tostring(root, encoding='utf-8').decode('utf-8')
    
    return ({"message": "W2 extraction successful", "xml": xml_str})

def sanitize_blob_name(blob_name):
    # Your existing sanitize function
    sanitized = re.sub(r'[()\[\]{}]', '', blob_name)
    sanitized = sanitized.replace(' ', '_')
    return sanitized

@app.route('/api/download_csv/<document_id>', methods=['GET', 'POST'])
async def download_csv(document_id):
    print("Entered download_csv function")
    json_data = await request.json
    client_id = json_data['clientID']
    db = DapDatabase(None, None)
    sanitized_doc_id = sanitize_blob_name(document_id)
    print(sanitized_doc_id)  
    csv_content = await db.generate_csv(sanitized_doc_id, client_id)

    await db.close()

    response = Response(csv_content, mimetype='text/csv')
    response.headers["Content-Disposition"] = f"attachment; filename={document_id}.csv" 
    
    return response

@app.route('/api/get_client_data', methods=['POST'])
async def get_client_data():
    json_data = await request.json
    client_id = json_data['clientID']

    # Use async with to ensure proper initialization and cleanup of TableBuilder
    async with TableBuilder() as table_builder:
        client_data = await table_builder.fetch_client_data(client_id)

    return jsonify({"data": client_data})

async def process_sort(file):
    filename = secure_filename(file.filename)
    print(f'Processing file: {filename}')
    file_stream = io.BytesIO(file.read())

    sorter = Sorter()
    result = await sorter.sort(file_stream)
    file_stream.close()

    return {**result, 'file_name': filename}

@app.route('/api/sort', methods=['POST'])
async def sort():
    print("files received")
    files = await request.files
    files_to_sort = files.getlist('files[]')

    # Schedule all file processing tasks to run concurrently
    sorted_files = await asyncio.gather(*(process_sort(file) for file in files_to_sort))
    
    print(f'sorted_files: {sorted_files}')
    return {'sorted_files': sorted_files}

@app.route('/api/download_all_documents', methods=['POST', 'GET'])
async def download_all_documents():
        data = await request.json
        client_id = data['clientID']
        document_names = data['documentNames']

        # Initialize the BlobServiceClient asynchronously
        blob_service_client = BlobServiceClient.from_connection_string(credentials.CONNECTION_STRING)
        container_client = blob_service_client.get_container_client(credentials.BUCKET_NAME_CUSTOMS)

        # Download the existing FOFtest.xlsx
        blob_client = container_client.get_blob_client('FOFtemplate.xlsx')
        fof_test_stream = BytesIO()
        stream_downloader = await blob_client.download_blob()
        await stream_downloader.readinto(fof_test_stream)
        fof_test_stream.seek(0)
        fof_workbook = openpyxl.load_workbook(fof_test_stream)

        db = DapDatabase(None, None)

        # Create a new workbook
        workbook = openpyxl.Workbook()
        workbook.remove(workbook.active)  # Remove the default sheet

        copy_worksheet(fof_workbook, workbook, 'Sheet1') 

        for document_name in document_names:
            sanitized_name = sanitize_blob_name(document_name)
            original_data, fof_data = await db.generate_sheet_data(sanitized_name, client_id)  
            
            # Add original sheet
            original_sheet = workbook.create_sheet(title=sanitized_name)
            for row in original_data:
                original_sheet.append(row)
            
            # Add FOF sheet
            fof_sheet = workbook.create_sheet(title=f"FOF_{sanitized_name}")
            for row in fof_data:
                fof_sheet.append(row)

        fof_sheet_objects = [workbook[sheet_name] for sheet_name in workbook.sheetnames if 'FOF_' in sheet_name]
        
        process_FOF(workbook, fof_sheet_objects) 

        # Save the workbook to a BytesIO object
        output_stream = BytesIO()
        workbook.save(output_stream)
        output_stream.seek(0)

        # Save the workbook to a temporary file
        async with aiofiles.tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
            await tmp.write(output_stream.getvalue())
            await tmp.flush()
            response = await send_file(tmp.name, as_attachment=True, attachment_filename=f"{client_id}_Customs_Batch_Data.xlsx")
        return response



if __name__ == "__main__":
    app.run(debug=True, port=8080)
    
    #main branch