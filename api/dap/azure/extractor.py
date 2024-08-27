from azure.storage.blob.aio import BlobServiceClient
from azure.storage.blob import generate_blob_sas, BlobSasPermissions
from azure.ai.documentintelligence.aio import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeResult, AnalyzeDocumentRequest
from azure.core.credentials import AzureKeyCredential
import dap.credentials as credentials
from database.dapdatabase import DapDatabase
import json
import datetime
import asyncio
from dap.form_mapping_utils import extractor_model_mapping


class Extractor:
    def __init__(self, container_name):
        self.blob_service_client = BlobServiceClient.from_connection_string(
            credentials.CONNECTION_STRING
        )
        self.blob_container_client = self.blob_service_client.get_container_client(
            container_name
        )

    async def update_database(self, client_id, blob_sas_url, doc_name, form_type, extracted_values, access_id):
        database = DapDatabase(client_id, blob_sas_url)
        try:
            for extracted_value in extracted_values:
                for field_name, field_data in extracted_value.items():
                    if isinstance(field_data, dict):
                        field_value = str(field_data['value'])
                        confidence = field_data['confidence']
                        bounding_box = json.dumps(field_data.get('bounding_box', []))
                    else:
                        field_value = str(field_data)
                        confidence = None
                        bounding_box = None

                    # Check if the value is of a custom type and convert it
                    if isinstance(field_value, list):
                        field_value = json.dumps(field_value.__dict__)

                    last_inserted_id = await database.post2postgres_extract(
                        client_id=client_id,
                        doc_url=blob_sas_url,
                        doc_name=doc_name,
                        doc_status='extracted',
                        doc_type=form_type,
                        field_name=field_name,
                        field_value=field_value,
                        confidence=confidence,
                        access_id=access_id,
                        bounding_box=bounding_box,
                    )
                    print(f"Last inserted ID for extraction: {last_inserted_id}")
        except Exception as e:
            print(f"An error occurred while inserting field '{field_name}': {e}")
        finally:
            await database.close()
            
    def get_document_intelligence_client(self, form_type):
        if form_type != 'K1-1065':
            endpoint = credentials.FORM_RECOGNIZER_ENDPOINT_PREBUILT
            key = credentials.FORM_RECOGNIZER_KEY_PREBUILT
        else:
            endpoint = credentials.FORM_RECOGNIZER_ENDPOINT_CUSTOM
            key = credentials.FORM_RECOGNIZER_KEY_CUSTOM_K1
            
        return DocumentIntelligenceClient(endpoint=endpoint, credential=AzureKeyCredential(key))
      
    async def extract(self, client_id, blob_name, form_type):
        document_intelligence_client = self.get_document_intelligence_client(form_type)
        blob_location = f"{client_id}/{blob_name}"
        sas_token = generate_blob_sas(
            account_name=self.blob_service_client.account_name,
            container_name=self.blob_container_client.container_name,
            blob_name=blob_location,
            account_key=credentials.KEY,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        )

        blob_sas_url = f"https://{self.blob_service_client.account_name}.blob.core.windows.net/{self.blob_container_client.container_name}/{blob_location}?{sas_token}"
        doc_url = f"https://{self.blob_service_client.account_name}.blob.core.windows.net/{self.blob_container_client.container_name}/{blob_location}"

        # Use async with for proper context management of the async client
        async with document_intelligence_client as client:
            poller = await client.begin_analyze_document(
                extractor_model_mapping.get(form_type, 'unsorted'),
                AnalyzeDocumentRequest(url_source=blob_sas_url)
            )
            result: AnalyzeResult = await poller.result()
            
        def extract_address_values(address_value):
            """Extracts individual address components into a dictionary."""
            return {
                "house_number": address_value.house_number,
                "road": address_value.road,
                "city": address_value.city,
                "state": address_value.state,
                "postal_code": address_value.postal_code
            }
            
        def extract_field_info(field, prefix=''):
            """Extracts information from a field with value, confidence, and bounding box."""
            value = field.get('valueString') or field.get('valueNumber') or field.get('value')
            confidence = field.get('confidence')
            
            bounding_box = []
            if field.get('boundingRegions'):
                for region in field['boundingRegions']:
                    bounding_box.append({
                        "pageNumber": region.page_number,
                        "polygon": region.polygon
                    })
            
            return {prefix: {'value': value, 'confidence': confidence, 'bounding_box': bounding_box}}

        def extract_array_info(array, prefix):
            """Extracts information from arrays of additional info, state, and local tax infos."""
            array_info = {}
            for idx, item in enumerate(array):
                item_prefix = f"{prefix}_{idx+1}"
                for key, value in item.get('valueObject', {}).items():
                    field_info = extract_field_info(value, prefix=f"{item_prefix}_{key}")
                    array_info.update(field_info)
            return array_info
        
        response_list = []
        for idx, result in enumerate(result.documents):
            print(f"--------Recognizing {form_type} #{idx}--------")
            w2_dict = {}
            for field_name, field in result.fields.items():
                if field_name in ["Employee", "Employer", "Borrower", "Lender", "Payer", "Recipient"]:
                    print(f"{field_name} data:")
                    person_data = field.get('valueObject')
                    for sub_field_name, sub_field in person_data.items():
                        if sub_field_name == "Address":
                            address_components = extract_address_values(sub_field.get('valueAddress'))
                            for component_name, component_value in address_components.items():
                                component_key = f"{field_name}_Address_{component_name}"
                                w2_dict[component_key] = {
                                    'value': component_value,
                                    'confidence': sub_field.confidence  # Assumes confidence is the same for all components
                                }
                                print(f"...{component_name.capitalize()}: {component_value} has confidence: {sub_field.confidence}")
                        else:
                            value = sub_field.get('valueString') or sub_field.get('valueNumber') or sub_field.get('value')
                            confidence = sub_field.confidence
                            w2_dict[f"{field_name}_{sub_field_name}"] = {
                                'value': value,
                                'confidence': confidence
                            }
                            print(f"...{sub_field_name}: {value} has confidence: {confidence}")
                # Handling arrays of AdditionalInfo, StateTaxInfos, and LocalTaxInfos
                elif field_name in ["AdditionalInfo", "StateTaxInfos", "LocalTaxInfos", "StateTaxesWithheld"]:
                    print(f"{field_name}:")
                    array_data = extract_array_info(field.get('valueArray', []), prefix=field_name)
                    w2_dict.update(array_data)

                else:
                    # Handle other fields similarly
                    field_info = extract_field_info(field, prefix=field_name)
                    w2_dict.update(field_info)

            response_list.append(w2_dict)
            print(w2_dict)
            print("----------------------------------------")

        return response_list, doc_url
