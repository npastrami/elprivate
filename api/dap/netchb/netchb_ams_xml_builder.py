from database.dapdatabase import DapDatabase
from dap.form_mapping_utils import netchb_term_matching
from dap.netchb.netchb_api_push import client

class NetchbAMSBuilder:
    def __init__(self, client_id, mawb_data):
        self.client_id = client_id
        self.mawb_data = mawb_data
        self.db = DapDatabase(client_id, None)  # Initialize with client_id only

    async def build_xml(self):
        xml = """
        <mawb xmlns="http://www.netchb.com/xml/mawb" xmlns:data="http://www.netchb.com/xml/data" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.netchb.com/xml/mawb http://www.netchb.com/xml/mawb/mawb.xsd">
        """

        # Required Fields
        xml += f"<mawb-prefix>{self.mawb_data['mawb_prefix']}</mawb-prefix>"
        xml += f"<mawb-number>{self.mawb_data['mawb_number']}</mawb-number>"
        xml += f"<origin-airport>{self.mawb_data['origin_airport']}</origin-airport>"
        xml += f"<arrival-airport>{self.mawb_data['arrival_airport']}</arrival-airport>"

        # Optional Fields
        if 'transmit-ams' in self.mawb_data:
            xml += "<transmit-ams>"
            xml += f"<transmission-type>{self.mawb_data['transmit-ams']['transmission_type']}</transmission-type>"
            if 'reason-for-amendment' in self.mawb_data['transmit-ams']:
                xml += f"<reason-for-amendment>{self.mawb_data['transmit-ams']['reason_for_amendment']}</reason-for-amendment>"
            xml += "</transmit-ams>"

        if 'transmit-acas' in self.mawb_data:
            xml += "<transmit-acas/>"

        if 'assign-to' in self.mawb_data:
            xml += f"<assign-to>{self.mawb_data['assign_to']}</assign-to>"

        if 'do-not-overwrite' in self.mawb_data:
            xml += "<do-not-overwrite/>"

        if 'do-not-delete-hawb-not-included' in self.mawb_data:
            xml += "<do-not-delete-hawb-not-included/>"

        if 'hawbs' in self.mawb_data:
            xml += "<hawbs>"
            for hawb in self.mawb_data['hawbs']:
                xml += "<hawb>"
                xml += f"<hawb-number>{hawb['hawb_number']}</hawb-number>"
                xml += f"<commercial-description>{hawb['commercial_description']}</commercial-description>"
                xml += "<shipper>"
                xml += f"<name>{hawb['shipper']['name']}</name>"
                xml += f"<address>{hawb['shipper']['address']}</address>"
                xml += f"<city>{hawb['shipper']['city']}</city>"
                if 'state-province' in hawb['shipper']:
                    xml += f"<state-province>{hawb['shipper']['state_province']}</state-province>"
                xml += f"<country>{hawb['shipper']['country']}</country>"
                if 'postal-code' in hawb['shipper']:
                    xml += f"<postal-code>{hawb['shipper']['postal_code']}</postal-code>"
                xml += "</shipper>"
                
                xml += "<consignee>"
                xml += f"<name>{hawb['consignee']['name']}</name>"
                xml += f"<address>{hawb['consignee']['address']}</address>"
                xml += f"<city>{hawb['consignee']['city']}</city>"
                if 'state-province' in hawb['consignee']:
                    xml += f"<state-province>{hawb['consignee']['state_province']}</state-province>"
                xml += f"<country>{hawb['consignee']['country']}</country>"
                if 'postal-code' in hawb['consignee']:
                    xml += f"<postal-code>{hawb['consignee']['postal_code']}</postal-code>"
                xml += "</consignee>"

                xml += f"<piece-count>{hawb['piece_count']}</piece-count>"
                xml += f"<weight>{hawb['weight']}</weight>"
                xml += f"<weight-unit>{hawb['weight_unit']}</weight-unit>"
                
                if 'value' in hawb:
                    xml += f"<value>{hawb['value']}</value>"
                if 'country-of-origin' in hawb:
                    xml += f"<country-of-origin>{hawb['country_of_origin']}</country-of-origin>"
                if 'hts' in hawb:
                    xml += f"<hts>{hawb['hts']}</hts>"

                xml += "</hawb>"
            xml += "</hawbs>"

        xml += "</mawb>"
        return xml

    async def push_to_netchb(self, xml):
        print(client.service)
        print("xml to be sent:", xml)
        response = client.service.uploadEntry('guylichtenstein-sbx', 'Kn2Tech@Miami1!!', xml)
        return response

    async def run(self):
        xml = await self.build_xml()
        response = await self.push_to_netchb(xml)
        print(response)
