from zeep import Client
import xml.etree.ElementTree as ET
from xml.dom import minidom

class CargoManifestQuery:
    def __init__(self):
        self.queries = []
        ET.register_namespace('', "http://www.netchb.com/xml/cmq")
        ET.register_namespace('xsi', "http://www.w3.org/2001/XMLSchema-instance")
        self.client = Client('https://www.netchb.com/main/services/cmq/CargoManifestQueryService?wsdl')

    def add_entry_query(self, filer_code: str, entry_no: str, check_sum: int) -> None:
        self.queries.append((filer_code, entry_no, check_sum))

    def build(self) -> str:
        root = ET.Element("{http://www.netchb.com/xml/cmq}queries")
        root.set('xmlns:xsi', "http://www.w3.org/2001/XMLSchema-instance")
        root.set('xsi:schemaLocation', "http://www.netchb.com/xml/cmq http://www.netchb.com/xml/cmq/cargo_manifest_query.xsd")

        for filer_code, entry_no, check_sum in self.queries:
            query_elem = ET.SubElement(root, "query")
            entry = ET.SubElement(query_elem, "entry-number")
            ET.SubElement(entry, "filer-code").text = filer_code
            ET.SubElement(entry, "entry-no").text = entry_no
            ET.SubElement(entry, "check-sum").text = str(check_sum)

        return minidom.parseString(ET.tostring(root)).toprettyxml(indent="  ")

    async def query_netchb(self, username: str, password: str) -> dict:
        try:
            xml_str = self.build()
            # First send the query
            transmission_id = self.client.service.sendQuery(username, password, xml_str)
            
            # Then check results using the transmission ID
            if transmission_id:
                response = self.client.service.checkQueryResults(username, password, transmission_id)
                return response
            return None
            
        except Exception as e:
            print(f"Error during NetChb API call: {e}")
            return None