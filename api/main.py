from quart import Quart, request, jsonify, Response, send_file
from quart_cors import cors
from werkzeug.utils import secure_filename
from dap.azure.uploader import Uploader
from dap.azure.extractor import Extractor
from dap.azure.catcher import Catcher
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
import aiohttp
from pdf2image import convert_from_path
import openpyxl
import traceback
import io
import tempfile
from tortoise import Tortoise, run_async
from tortoise.transactions import in_transaction
from accounts.models.index import TORTOISE_ORM
import accounts.models.index as modelIndex
from accounts.models.role_model import Role
from accounts.routes.auth_routes import auth_routes
from accounts.routes.user_routes import user_routes
from accounts.controllers.user_controller import user_controller
from accounts.controllers.auth_controller import auth_controller
import json
from dap.netchb.netchb_ams_xml_builder import NetchbAMSBuilder

app = Quart(__name__)
# Enable CORS for all routes and origins
app = cors(app, allow_origin="http://localhost:8081", allow_methods=["GET", "POST", "OPTIONS", "PUT"], allow_headers=["Content-Type", "Authorization"])
app.register_blueprint(auth_routes)
app.register_blueprint(user_routes)
app.register_blueprint(user_controller, url_prefix='/api', allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])
app.register_blueprint(auth_controller, url_prefix='/api/auth', allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

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
            return {"status": "Awaiting Review", "xml": xml_str}
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

@app.route('/api/get_documents_for_review', methods=['POST'])
async def get_documents_for_review():
    data = await request.json
    client_id = data.get('client_id', None)
    
    db = DapDatabase(client_id, None)
    documents = await db.get_documents_for_review(client_id)
    await db.close()
    
    return jsonify({"documents": documents})

@app.route('/api/get_document_image', methods=['POST'])
async def get_document_image():
    data = await request.get_json()
    doc_name = data.get('doc_name')
    client_id = data.get('client_id', None)
    
    db = DapDatabase(client_id, None)
    doc_url = await db.get_document_image(doc_name)

    if not doc_url:
        return jsonify({"error": "Document not found"}), 404

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(doc_url) as resp:
                print(f"Status: {resp.status}")
                if resp.status == 200:
                    pdf_content = await resp.read()

                    # Write the PDF content to a temporary file
                    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_pdf:
                        temp_pdf.write(pdf_content)
                        temp_pdf_path = temp_pdf.name

                    # Convert the PDF to images (PNG)
                    images = convert_from_path(temp_pdf_path)

                    # Save the first page as a PNG file in a temporary directory
                    temp_png_path = tempfile.mktemp(suffix=".png")
                    images[0].save(temp_png_path, 'PNG')

                    # Return the PNG file as a response
                    return await send_file(temp_png_path, mimetype='image/png')

                else:
                    return jsonify({"error": "Failed to download document"}), 500

    except Exception as e:
        # Log the exception
        print(f"Error while processing the document: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500
    
@app.route('/api/approve_document', methods=['POST'])
async def approve_document():
    data = await request.get_json()
    doc_name = data.get('doc_name')
    client_id = data.get('client_id')
    approved = data.get('approved')  # Get the approved status from the request
    edited_fields = data.get('edited_fields', [])  # Get the edited fields from the request
    print("edited fields: ", edited_fields)

    if not doc_name or not client_id:
        return jsonify({"error": "Missing doc_name or client_id"}), 400

    db = DapDatabase(None, None)
    new_status = 'reviewed' if approved else 'extracted'

    # Update the status of the document
    await db.update_review_status(doc_name, client_id, new_status)

    # Update the edited fields in the database
    for field in edited_fields:
        field_name = field.get('field_name')
        field_value = field.get('field_value')
        if field_name and field_value is not None:
            await db.update_field_value(client_id, doc_name, field_name, field_value)

    await db.close()

    return jsonify({"status": "success", "new_status": new_status})

@app.route('/api/get_services', methods=['POST'])
async def get_services():
    data = await request.get_json()
    user_id = data.get('user_id')

    async with db_instance.pool.acquire() as connection:
        services = await connection.fetchval('''
            SELECT services FROM accounts WHERE username = $1;
        ''', user_id)
        
        print(services)

        if services:
            return jsonify({"services": services})
        else:
            return jsonify({"services": {}}), 200
        
@app.route('/api/add_service', methods=['POST'])
async def add_service():
    data = await request.get_json()
    username = data.get('user_id')
    service_type = data.get('service_type')
    documents = data.get('documents')
    notes = data.get('notes')

    service_id = await db_instance.add_service(username, service_type, documents, notes)

    if service_id:
        return jsonify({"message": "Service added successfully", "service_id": service_id}), 201
    else:
        return jsonify({"message": "Failed to add service"}), 500

@app.route('/api/generate_final_docs', methods=['POST'])
async def generate_final_docs():
    data = await request.get_json()
    client_id = data.get('client_id')
    doc_names = data.get('doc_names', [])
    send_to_catcher = data.get('send_to_catcher', False)
    print(f"list of doc_name to print: {doc_names}")
    
    print(f"Generating final docs for client_id: {client_id}, document: {doc_names}")
    catcher = Catcher('approved-docs')
    db = DapDatabase(client_id, None)

    final_urls = []
    approved_docs = await db.get_documents_for_review(client_id)

    for doc_name in doc_names:
        matching_docs = [doc for doc in approved_docs if doc['doc_name'] == doc_name]
        
        if matching_docs:
            field_data = {
                doc['field_name']: {'value': doc['field_value'], 'confidence': doc['confidence']}
                for doc in matching_docs
            }
            
            if send_to_catcher:
                print("sending to catcher")
                final_url = await catcher.upload_final_document(client_id, doc_name, field_data)
                print(f"final_url for {doc_name}: {final_url}")
                final_urls.append(final_url)
            else:
                # Save to approved_docs database without uploading to Catcher
                final_url = None
                print("skipping the catcher")
                last_inserted_id = await db.save_approved_document(client_id, doc_name, final_url, field_data)
                print(f"Document {doc_name} saved to approved_docs with ID: {last_inserted_id}")
                final_urls.append(f"Saved to database with ID: {last_inserted_id}")
                
            # Trigger the XML generation and submission for AMS MAWB
            mawb_data = {
                "mawb_prefix": "001",  # Example data, replace with actual values
                "mawb_number": "12345678",
                "origin_airport": "JFK",
                "arrival_airport": "LAX",
                "hawbs": [
                    {
                        "hawb_number": "HAWB001",
                        "commercial_description": "Electronics",
                        "shipper": {
                            "name": "Shipper Name",
                            "address": "123 Shipper St",
                            "city": "Shipper City",
                            "country": "US"
                        },
                        "consignee": {
                            "name": "Consignee Name",
                            "address": "456 Consignee Ave",
                            "city": "Consignee City",
                            "country": "US"
                        },
                        "piece_count": 10,
                        "weight": 100.0,
                        "weight_unit": "K",
                    }
                ]
            }

            # Create an instance of NetchbAMSBuilder and build the XML
            ams_builder = NetchbAMSBuilder(client_id, mawb_data)
            xml_str = await ams_builder.build_xml()
            
            # Push the XML to the sandbox API and print the response
            response = await ams_builder.push_to_netchb(xml_str)
            print(f"Response from sandbox API for {doc_name}: {response}")

    await db.close()

    return jsonify({"final_docs": final_urls})    
# @app.route('/api/generate_final_docs', methods=['POST'])
# async def generate_final_docs():
#     data = await request.get_json()
#     client_id = data.get('client_id')
#     doc_names = data.get('doc_names', [])
#     send_to_catcher = data.get('send_to_catcher', False)
#     print(f"list of doc_name to print: {doc_names}")
    
#     print(f"Generating final docs for client_id: {client_id}, document: {doc_names}")
#     catcher = Catcher('approved-docs')
#     db = DapDatabase(client_id, None)

#     final_urls = []

#     approved_docs = await db.get_documents_for_review(client_id)

#     for doc_name in doc_names:
#         matching_docs = [doc for doc in approved_docs if doc['doc_name'] == doc_name]
        
#         if matching_docs:
#             field_data = {
#                 doc['field_name']: {'value': doc['field_value'], 'confidence': doc['confidence']}
#                 for doc in matching_docs
#             }
            
#             if send_to_catcher:
#                 print("sending to catcher")
#                 final_url = await catcher.upload_final_document(client_id, doc_name, field_data)
#                 print(f"final_url for {doc_name}: {final_url}")
#                 final_urls.append(final_url)
#             else:
#                 # Save to approved_docs database without uploading to Catcher
#                 final_url = None
#                 print("skipping the catcher")
#                 last_inserted_id = await db.save_approved_document(client_id, doc_name, final_url, field_data)
#                 print(f"Document {doc_name} saved to approved_docs with ID: {last_inserted_id}")
#                 final_urls.append(f"Saved to database with ID: {last_inserted_id}")
#         else:
#             print(f"No matching documents found for {doc_name}.")

#     await db.close()

#     return jsonify({"final_docs": final_urls})

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