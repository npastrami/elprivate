import asyncpg
import os
import csv
from io import StringIO
from azure.storage.blob.aio import BlobServiceClient
from azure.storage.blob import generate_blob_sas, BlobSasPermissions
import datetime
import dap.credentials as credentials
import base64
import json

class DapDatabase:
    def __init__(self, client_id, doc_url):
        self.client_id = client_id
        self.doc_url = doc_url
        self.conn = None
        
        # Initialize the BlobServiceClient and BlobContainerClient
        self.blob_service_client = BlobServiceClient.from_connection_string(credentials.CONNECTION_STRING)
        self.blob_container_client = self.blob_service_client.get_container_client("extract-custinv")
        
    async def ensure_connected(self):
        if self.conn is None:
            await self.connect()

    async def connect(self):
        self.conn = await asyncpg.connect(
            database="dapdatabase",
            user="postgres",
            password="newpassword",
            host="localhost",
            port="5432"
        )
        await self.create_table()

    async def create_table(self):
        await self.ensure_connected()
        create_table_query = """
        CREATE TABLE IF NOT EXISTS client_docs (
            id SERIAL PRIMARY KEY,
            client_id TEXT,
            doc_url TEXT,
            doc_name TEXT,
            doc_status TEXT,
            doc_type TEXT,
            container_name TEXT,
            access_id TEXT
        );
        """
        await self.conn.execute(create_table_query)
        
        create_extracted_fields_table_query = """
        CREATE TABLE IF NOT EXISTS extracted_fields (
            id SERIAL PRIMARY KEY,
            client_id TEXT,
            doc_url TEXT,
            doc_name TEXT,
            doc_status TEXT,
            doc_type TEXT,
            field_name TEXT,
            field_value TEXT,
            confidence REAL,
            access_id TEXT
        );
        """
        await self.conn.execute(create_extracted_fields_table_query)
        
            # Create table for approved documents
        create_approved_docs_table_query = """
        CREATE TABLE IF NOT EXISTS approved_docs (
            id SERIAL PRIMARY KEY,
            client_id TEXT,
            doc_name TEXT,
            doc_url TEXT,
            approved_date TIMESTAMP,
            field_data JSONB
        );
        """
        await self.conn.execute(create_approved_docs_table_query)


    async def post2postgres_upload(self, client_id, doc_url, doc_status, doc_type, container_name, access_id):
        await self.ensure_connected()
        doc_name = os.path.basename(doc_url)  
        insert_query = """
        INSERT INTO client_docs (client_id, doc_url, doc_name, doc_status, doc_type, container_name, access_id)  
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
        """
        last_inserted_id = await self.conn.fetchval(insert_query, client_id, doc_url, doc_name, doc_status, doc_type, container_name, access_id)
        return last_inserted_id
    
    async def post2postgres_extract(self, client_id, doc_url, doc_name, doc_status, doc_type, field_name, field_value, confidence, access_id):
        await self.ensure_connected()
        insert_query = """
        INSERT INTO extracted_fields (client_id, doc_url, doc_name, doc_status, doc_type, field_name, field_value, confidence, access_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;
        """
        # Use fetchval to execute the query and get the returned value
        last_inserted_id = await self.conn.fetchval(insert_query, client_id, doc_url, doc_name, doc_status, doc_type, field_name, field_value, confidence, access_id)

        update_status_query = """
        UPDATE client_docs SET doc_status = 'extracted' WHERE client_id = $1 AND doc_url = $2;
        """
        # Use execute for the update query as it does not return a value
        await self.conn.execute(update_status_query, client_id, doc_url)
        
        return last_inserted_id
    
    async def get_field_values(self, client_id, doc_type):
        await self.ensure_connected()
        query = """
        SELECT field_name, field_value
        FROM extracted_fields
        WHERE client_id = $1 AND doc_type = $2;
        """
        rows = await self.conn.fetch(query, client_id, doc_type)
        return rows
    
    async def get_documents_for_review(self, client_id=None):
        await self.ensure_connected()
        if client_id:
            query = """
            SELECT DISTINCT ON (doc_url, field_name) * FROM extracted_fields 
            WHERE client_id = $1 AND field_value IS NOT NULL
            ORDER BY doc_url, field_name, id ASC;
            """
            rows = await self.conn.fetch(query, str(client_id))  # Ensure client_id is a string
        else:
            query = """
            SELECT DISTINCT ON (doc_url, field_name) * FROM extracted_fields 
            WHERE field_value IS NOT NULL
            ORDER BY doc_url, field_name, id ASC;
            """
            rows = await self.conn.fetch(query)

        return [dict(row) for row in rows]


    async def get_document_image(self, doc_name):
        await self.ensure_connected()
        query = """
        SELECT doc_url FROM client_docs WHERE doc_name = $1;
        """
        doc_url = await self.conn.fetchval(query, doc_name)

        if doc_url:
            blob_location = doc_url.split(self.blob_container_client.url)[-1].lstrip('/')
            
            sas_token = generate_blob_sas(
                account_name=self.blob_service_client.account_name,
                container_name=self.blob_container_client.container_name,
                blob_name=blob_location,
                account_key=credentials.KEY,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            )

            doc_url = f"{doc_url}?{sas_token}"
            print(doc_url)

        return doc_url
    
    # async def approve_document(self, client_id, doc_name):
    #     await self.ensure_connected()
    #     print(f"Connected to database. Saving document {doc_name} for client {client_id}.")
    #     query = """
    #     UPDATE client_docs 
    #     SET doc_status = 'reviewed' 
    #     WHERE doc_name = $1 AND client_id = $2;
    #     """
    #     result = await self.conn.execute(query, client_id, doc_name)
    #     print(f"Update result: {result}")
        
    async def update_field_value(self, client_id, doc_name, field_name, field_value):
        await self.ensure_connected()
        query = """
        UPDATE extracted_fields
        SET field_value = $1
        WHERE client_id = $2 AND doc_name = $3 AND field_name = $4;
        """
        await self.conn.execute(query, field_value, client_id, doc_name, field_name)
        
    async def update_review_status(self, doc_name, client_id, new_status):
        await self.ensure_connected()
        print(f"Updating document {doc_name} for client {client_id} to status {new_status}.")
        query = """
        UPDATE client_docs 
        SET doc_status = $1 
        WHERE doc_name = $2 AND client_id = $3;
        """
        result = await self.conn.execute(query, new_status, doc_name, client_id)
        print(f"Update result: {result}")

        # Also update the status in extracted_fields table
        update_extracted_query = """
        UPDATE extracted_fields
        SET doc_status = $1
        WHERE doc_name = $2 AND client_id = $3;
        """
        await self.conn.execute(update_extracted_query, new_status, doc_name, client_id)
        
    async def save_approved_document(self, client_id, doc_name, doc_url, field_data):
        await self.ensure_connected()
        print(f"Connected to database. Saving document {doc_name} for client {client_id}.")
        
        insert_query = """
        INSERT INTO approved_docs (client_id, doc_name, doc_url, approved_date, field_data)
        VALUES ($1, $2, $3, $4, $5) RETURNING id;
        """
        
        approved_date = datetime.datetime.utcnow()
        print(f"Executing query: {insert_query}")
        
        last_inserted_id = await self.conn.fetchval(insert_query, client_id, doc_name, doc_url, approved_date, json.dumps(field_data))
        print(f"Document saved with ID: {last_inserted_id}")
        
        return last_inserted_id

    
    async def generate_csv(self, document_id, client_id):
        await self.ensure_connected()
        # Query to fetch all fields and values for a specific document and client
        query = """ SELECT field_name, field_value, confidence FROM extracted_fields WHERE doc_name = $1 AND client_id = $2"""
        rows = await self.conn.fetch(query, document_id, client_id)
        # Initialize CSV output in memory
        output = StringIO()
        csv_writer = csv.writer(output)

        # Write the document name in cell A1
        csv_writer.writerow([f"Document Name: {document_id}"])

        # Write "Field Names" in cell A2 and "Field Values" in cell B2
        csv_writer.writerow(["Field Names", "Field Values", "Confidence"])

        # Populate the rest of the columns with field names and their values
        for row in rows:
            csv_writer.writerow([row[0], row[1], row[2]])

        # Get the CSV content and reset the pointer
        csv_content = output.getvalue()
        output.seek(0)

        return csv_content
    
    async def generate_sheet_data(self, document_id, client_id):
        await self.ensure_connected()
        query = """SELECT field_name, field_value, confidence FROM extracted_fields WHERE doc_name = $1 AND client_id = $2"""
        rows = await self.conn.fetch(query, document_id, client_id)

        original_sheet_data = [
            ["Document Name: {}".format(document_id)],
            ["Field Names", "Field Values", "Confidence"]
        ]

        keywords_data = {}

        for field_name, field_value, confidence in rows:
            original_sheet_data.append([field_name, field_value, confidence])

            # Extract item codes from code keywords
            if '[code' in field_name:
                # print(field_name)
                keyword, code = field_name.split(' [')
                # print(keyword)
                code = code.rstrip(']')
                # print(code)
                
                # Extracting the number from the code
                code_number = code.split(' ')[-1]
                modified_keyword = f"{keyword} {code_number}"
                # print(f"mod keyword: {modified_keyword}")
                # Store code and confidence in the dictionary for modified_keyword
                if modified_keyword not in keywords_data:
                    keywords_data[modified_keyword] = {'code': field_value, 'code_confidence': confidence}

                # Update code for the original keyword if it exists - adds code to keyword in keyword_data before amount or confidence
                if keyword in keywords_data:
                    keywords_data[keyword].update({'code': field_value})
            else:
                keyword = field_name  # bring in amount-keywords
                # add amount and confidence to keywords data
                if keyword not in keywords_data:
                    keywords_data[keyword] = {'amount': field_value, 'amount_confidence': confidence}
                else:
                    # Update in case of append cause GPT said to
                    keywords_data[keyword].update({'amount': field_value, 'amount_confidence': confidence})

        # print(f"keyword data:{keywords_data}") 
        # Construct the FOF sheet data
        fof_sheet_data = [
            ["Document Name: FOF_{}".format(document_id)],
            ["Keyword", "Item Codes", "Amount", "Confidence"]
        ]

        for keyword, data in keywords_data.items():
            row = [
                keyword,
                data.get('code', ''),
                data.get('amount', ''),
                data.get('amount_confidence', 0)
            ]
            fof_sheet_data.append(row)

        return original_sheet_data, fof_sheet_data

    async def close(self):
        if self.conn is not None:
            await self.conn.close()