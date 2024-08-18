from azure.storage.blob.aio import BlobServiceClient
from azure.storage.blob import BlobSasPermissions, generate_blob_sas
import datetime
import dap.credentials as credentials
from database.dapdatabase import DapDatabase
import asyncpg
import json
import os
from io import StringIO
import csv

class Catcher:
    def __init__(self, container_name):
        self.connection_string = credentials.CONNECTION_STRING
        self.container_name = container_name
        self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)

    async def upload_final_document(self, client_id, doc_name, field_data):
        # Create blob container client
        blob_container_client = self.blob_service_client.get_container_client(self.container_name)
        print(f"Blob container client: {blob_container_client}")
        blob_name = f"{client_id}/final_docs/{doc_name}"

        # Generate CSV content with field names and values
        csv_content = self.generate_csv_content(doc_name, field_data)
        # print(f"Generated CSV content: {csv_content}")

        # Upload the CSV content to Azure Blob Storage
        blob_client = blob_container_client.get_blob_client(blob_name)
        await blob_client.upload_blob(csv_content.encode('utf-8'), overwrite=True)
        print(f"Uploaded CSV to blob: {blob_name}")

        # Generate a SAS URL for the blob
        sas_token = generate_blob_sas(
            account_name=self.blob_service_client.account_name,
            container_name=self.container_name,
            blob_name=blob_name,
            account_key=credentials.KEY,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        )
        blob_url = f"https://{self.blob_service_client.account_name}.blob.core.windows.net/{self.container_name}/{blob_name}?{sas_token}"
        print(f"Generated SAS URL: {blob_url}")

        database = DapDatabase(client_id, blob_url)
        # print(f"Saving approved document with data: {field_data}")
        await database.save_approved_document(client_id, doc_name, blob_url, field_data)
        await database.close()
        print(f"Saved approved document to database.")

        return blob_url

    def generate_csv_content(self, doc_name, field_data):
        # Initialize CSV output in memory
        output = StringIO()
        csv_writer = csv.writer(output)

        # Write the document name in cell A1
        csv_writer.writerow([f"Document Name: {doc_name}"])

        # Write "Field Names" in cell A2 and "Field Values" in cell B2
        csv_writer.writerow(["Field Name", "Field Value", "Confidence"])

        # Populate the rest of the columns with field names and their values
        for field_name, field_info in field_data.items():
            csv_writer.writerow([field_name, field_info['value'], field_info.get('confidence', 'N/A')])

        return output.getvalue()
