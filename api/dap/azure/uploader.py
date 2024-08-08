from azure.storage.blob.aio import BlobServiceClient
import dap.credentials as credentials
from werkzeug.utils import secure_filename

class Uploader:
    def __init__(self, container_name):
        self.connection_string = credentials.CONNECTION_STRING
        self.container_name = container_name

    async def upload(self, client_id, file):
        print("Debug: Received request for upload")
        async with BlobServiceClient.from_connection_string(self.connection_string) as blob_service_client:
            blob_container_client = blob_service_client.get_container_client(self.container_name)
            filename = secure_filename(file.filename)
            blob_name = f"{client_id}/{filename}"
            blob_client = blob_container_client.get_blob_client(blob_name)
            await blob_client.upload_blob(file.read(), overwrite=True)
            blob_url = blob_client.url
            return blob_url
