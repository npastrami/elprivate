from azure.ai.documentintelligence.models import AnalyzeResult
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence.aio import DocumentIntelligenceClient
import dap.credentials as credentials
from dap.form_mapping_utils import sorter_form_mapping
import io

class Sorter:
    def __init__(self):
        self.endpoint = credentials.FORM_RECOGNIZER_ENDPOINT_PREBUILT
        self.key = credentials.FORM_RECOGNIZER_KEY_PREBUILT

    async def sort(self, file_stream):
        file_bytes = io.BytesIO(file_stream.read())
        file_bytes.seek(0)

        # Use the asynchronous client with async with for proper context management
        async with DocumentIntelligenceClient(self.endpoint, AzureKeyCredential(self.key)) as document_intelligence_client:
            # Start the document analysis and await its completion
            poller = await document_intelligence_client.begin_analyze_document(
                "prebuilt-read",
                analyze_request=file_bytes,
                content_type="application/octet-stream",
            )
            result: AnalyzeResult = await poller.result()

        form_type = 'None'
        for page in result.pages:
            for word in page.words:
                print(f"Word '{word.content}' has a confidence of {word.confidence}")

            # Determine form type based on keywords
            doc_text = " ".join([line.content for line in page.lines])
            for form, keywords in sorter_form_mapping.items():
                if any(keyword in doc_text for keyword in keywords):
                    form_type = form
                    print(f"Match found: {form}")
                    break
            if form_type != 'None':
                break  # Break if a form type is found

        return {'form_type': form_type}