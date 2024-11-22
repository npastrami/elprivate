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

        async with DocumentIntelligenceClient(self.endpoint, AzureKeyCredential(self.key)) as document_intelligence_client:
            poller = await document_intelligence_client.begin_analyze_document(
                "prebuilt-read",
                analyze_request=file_bytes,
                content_type="application/octet-stream",
            )
            result: AnalyzeResult = await poller.result()

        form_type = 'None'
        best_match_percentage = 0
        best_match_count = 0

        for page in result.pages:
            for word in page.words:
                print(f"Word '{word.content}' has a confidence of {word.confidence}")

            doc_text = " ".join([line.content for line in page.lines])
            
            for form, keywords in sorter_form_mapping.items():
                matches = sum(1 for keyword in keywords if keyword in doc_text)
                match_percentage = (matches / len(keywords)) * 100
                
                print(f"Form: {form}, Matches: {matches}/{len(keywords)} ({match_percentage:.1f}%)")
                
                if match_percentage > best_match_percentage or \
                   (match_percentage == best_match_percentage and matches > best_match_count):
                    form_type = form
                    best_match_percentage = match_percentage
                    best_match_count = matches

        return {'form_type': form_type}