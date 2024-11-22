from lxml import etree as ET
import pandas as pd
import asyncio
from zeep import Client

class EntryXMLBuilder:
    def __init__(self, client_id, mawb_data, mapping_file, namespaces=None, root_tag="entry"):
        self.client_id = client_id
        self.mawb_data = mawb_data
        self.namespaces = namespaces or {
            'entry': 'http://www.netchb.com/xml/entry',
            'data': 'http://www.netchb.com/xml/data'
        }
        self.root_tag = root_tag

        # Initialize the root element with namespaces and schema location
        self.root = ET.Element(f"{{{self.namespaces['entry']}}}{self.root_tag}", nsmap={
            None: self.namespaces['entry'],
            "xsi": "http://www.w3.org/2001/XMLSchema-instance"
        })
        xsi_schemaLocation = ET.QName("http://www.w3.org/2001/XMLSchema-instance", "schemaLocation")
        self.root.set(xsi_schemaLocation, "http://www.netchb.com/xml/entry http://www.netchb.com/xml/entry/entry.xsd")

        # Load and parse the mapping file
        self.mapping_df = pd.read_excel(mapping_file)
        self.mapping_df.columns = self.mapping_df.columns.str.strip()

    def build_xml_from_mapping(self):
        created_elements = set()
        self._process_element(self.root, None, 1, created_elements)
        return self
    
    def _process_element(self, parent, current_element, level, created_elements):
        """
        Recursive function to process each level based on the mapping file.
        """
        level_col = f'lvl{level}_element'
        next_level_col = f'lvl{level + 1}_element' if f'lvl{level + 1}_element' in self.mapping_df.columns else None

        # Get the elements for current level
        if current_element is None:
            elements = self.mapping_df[
                (self.mapping_df[level_col].notna()) & 
                (self.mapping_df['complex'].isna())
            ]
        else:
            elements = self.mapping_df[
                (self.mapping_df[level_col] == current_element) &
                (self.mapping_df['complex'].isna())
            ]

        for _, row in elements.iterrows():
            element_name = row[level_col]
            element_type = row['type'] if 'type' in row and pd.notna(row['type']) else None
            
            # Skip duplicates for level 1 elements
            if level == 1 and element_name in created_elements:
                continue
            
            # Handle entry-no special case since it's a fundamental structure
            if element_name == "entry-no":
                entry_no_element = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}{element_name}")
                child_element = ET.SubElement(entry_no_element, f"{{{self.namespaces['entry']}}}user-specified")
                self._populate_children(child_element, "user-specified", level + 1)
                created_elements.add(element_name)
                # ET.SubElement(entry_no_element, f"{{{self.namespaces['entry']}}}system-generated")
                continue

            # Create the element
            current = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}{element_name}")
            created_elements.add(element_name)

            # Handle special container elements that need grouped children
            if element_name in ["invoices", "manifest", "header", "consolidated-entries", "ace-cargo-release-parties"]:
                self._populate_container(current, element_name)
                continue

            # Set value if available and not a complex type
            if not element_type and element_name in self.mawb_data:
                value = self.mawb_data[element_name]
                if value is not None:
                    current.text = str(value)

            # Handle child elements based on type or next level
            if element_type:
                self._process_complex_type(current, element_type, level)
            elif next_level_col and pd.notna(row[next_level_col]):
                self._process_element(current, row[next_level_col], level + 1, created_elements)

        return parent

    def _process_complex_type(self, parent, complex_type, current_level):
        """
        Process elements that belong to a complex type.
        """
        # Find all elements belonging to this complex type
        complex_elements = self.mapping_df[self.mapping_df['complex'] == complex_type]
        created_elements = set()

        # Create a wrapper element if needed based on type
        wrapper_element = None
        if complex_type in ['invoiceType', 'lineItemType', 'billOfLadingType']:
            wrapper_name = {
                'invoiceType': 'invoice',
                'lineItemType': 'line-item',
                'billOfLadingType': 'bill-of-lading'
            }.get(complex_type)
            if wrapper_name:
                wrapper_element = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}{wrapper_name}")
                parent = wrapper_element

        for _, row in complex_elements.iterrows():
            element_name = row['lvl1_element']
            if element_name in created_elements:
                continue

            # Check for nested elements
            current_element = None
            for level in range(1, 6):
                level_col = f'lvl{level}_element'
                if level_col in row and pd.notna(row[level_col]):
                    element_name = row[level_col]
                    if current_element is None:
                        current_element = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}{element_name}")
                    else:
                        current_element = ET.SubElement(current_element, f"{{{self.namespaces['entry']}}}{element_name}")
                    
                    # Set value if available in mawb_data
                    if element_name in self.mawb_data:
                        value = self.mawb_data[element_name]
                        if value is not None:
                            current_element.text = str(value)

            created_elements.add(element_name)

    def _populate_container(self, parent, container_type):
        """
        Helper function to populate container elements with grouped children.
        """
        if container_type == "header":
            # Group ultimate-consignee elements
            if any(key in self.mawb_data for key in ['tax-id', 'consignee-name', 'multiple']):
                consignee = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}ultimate-consignee")
                for field in ['tax-id', 'consignee-name', 'multiple']:
                    if field in self.mawb_data:
                        element = ET.SubElement(consignee, f"{{{self.namespaces['entry']}}}{field}")
                        value = self.mawb_data[field]
                        if value is not None:
                            element.text = str(value)

            # Group remote-entry elements
            if any(key in self.mawb_data for key in ['preparer-port', 'remote-exam-port', 'preparer-office-code']):
                remote = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}remote-entry")
                for field in ['preparer-port', 'remote-exam-port', 'preparer-office-code']:
                    if field in self.mawb_data:
                        element = ET.SubElement(remote, f"{{{self.namespaces['entry']}}}{field}")
                        value = self.mawb_data[field]
                        if value is not None:
                            element.text = str(value)

            # Add other header elements
            header_elements = self.mapping_df[
                (self.mapping_df['complex'] == 'headerType') |
                (self.mapping_df['type'] == 'headerType')
            ]
            
            # Handle non-grouped fields
            grouped_fields = ['tax-id', 'consignee-name', 'multiple', 
                            'preparer-port', 'remote-exam-port', 'preparer-office-code']
            header_only_fields = [
                field for field in header_elements['lvl1_element'].unique() 
                if field not in grouped_fields and field in self.mawb_data
            ]
            
            # Add header-level elements
            for field in header_only_fields:
                if field in self.mawb_data:
                    element = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}{field}")
                    value = self.mawb_data[field]
                    if value is not None:
                        element.text = str(value)

        if container_type == "ace-cargo-release-parties":
            if "ace_entities" in self.mawb_data:
                for entity_data in self.mawb_data["ace_entities"]:
                    # Create entity element
                    entity = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}entity")
                    
                    # Add entity code
                    if "entity-code" in entity_data:
                        entity_code = ET.SubElement(entity, f"{{{self.namespaces['entry']}}}entity-code")
                        entity_code.text = entity_data["entity-code"]
                    
                    # Add entity name
                    if "entity-name" in entity_data:
                        entity_name = ET.SubElement(entity, f"{{{self.namespaces['entry']}}}entity-name")
                        entity_name.text = entity_data["entity-name"]
                    
                    # Add entity information
                    if "entity-information" in entity_data:
                        entity_info = ET.SubElement(entity, f"{{{self.namespaces['entry']}}}entity-information")
                        info_data = entity_data["entity-information"]
                        
                        if "entity-address" in info_data:
                            address = ET.SubElement(entity_info, f"{{{self.namespaces['entry']}}}entity-address")
                            addr_data = info_data["entity-address"]
                            
                            # Handle address components
                            if "address-components" in addr_data:
                                components = ET.SubElement(address, f"{{{self.namespaces['entry']}}}address-components")
                                for comp in addr_data["address-components"]:
                                    component = ET.SubElement(components, f"{{{self.namespaces['entry']}}}address-component")
                                    
                                    comp_type = ET.SubElement(component, f"{{{self.namespaces['entry']}}}component-type")
                                    comp_type.text = comp["component-type"]
                                    
                                    comp_info = ET.SubElement(component, f"{{{self.namespaces['entry']}}}address-information")
                                    comp_info.text = comp["address-information"]
                            
                            # Add remaining address fields
                            for field in ["city", "state-province-code", "postal-code", "country"]:
                                if field in addr_data:
                                    element = ET.SubElement(address, f"{{{self.namespaces['entry']}}}{field}")
                                    element.text = addr_data[field]

        elif container_type == "invoices":
            invoice = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}invoice")
            
            # Add main invoice elements first (in order)
            for field in ['invoice-no', 'aii-supplier-id', 'ultimate-consignee-tax-id']:
                if field in self.mawb_data:
                    element = ET.SubElement(invoice, f"{{{self.namespaces['entry']}}}{field}")
                    if self.mawb_data[field] is not None:
                        element.text = str(self.mawb_data[field])
            
            # Add related-party if exists (empty element if None)
            if 'related-party' in self.mawb_data:
                ET.SubElement(invoice, f"{{{self.namespaces['entry']}}}related-party")

            # Create line-items container
            line_items = ET.SubElement(invoice, f"{{{self.namespaces['entry']}}}line-items")
            
            # Create single line-item
            line_item = ET.SubElement(line_items, f"{{{self.namespaces['entry']}}}line-item")
            
            # Add required line item elements in order
            for field in ['export-date', 'country-origin', 'manufacturer-id', 'country-export', 'lading-port', 'gross-weight']:
                if field in self.mawb_data:
                    element = ET.SubElement(line_item, f"{{{self.namespaces['entry']}}}{field}")
                    if self.mawb_data[field] is not None:
                        element.text = str(self.mawb_data[field])
            
            # Add tariffs section
            if 'tariff' in self.mawb_data:
                tariffs = ET.SubElement(line_item, f"{{{self.namespaces['entry']}}}tariffs")
                for tariff_data in self.mawb_data['tariff']:
                    tariff = ET.SubElement(tariffs, f"{{{self.namespaces['entry']}}}tariff")
                    for tariff_field in ['tariff-no', 'value', 'quantity1', 'unit-of-measure1', 
                                    'special-program', 'duty', 'quantity2', 'unit-of-measure2']:
                        if tariff_field in tariff_data:
                            element = ET.SubElement(tariff, f"{{{self.namespaces['entry']}}}{tariff_field}")
                            element.text = str(tariff_data[tariff_field])
            
            # Add fees section
            if 'fees' in self.mawb_data:
                fees = ET.SubElement(line_item, f"{{{self.namespaces['entry']}}}fees")
                for fee_data in self.mawb_data['fees']:
                    fee = ET.SubElement(fees, f"{{{self.namespaces['entry']}}}fee")
                    for fee_field in ['class-code', 'tariff-no', 'amount']:
                        if fee_field in fee_data:
                            element = ET.SubElement(fee, f"{{{self.namespaces['entry']}}}{fee_field}")
                            element.text = str(fee_data[fee_field])
            
            # Add party information
            for field in ['delivered-to', 'sold-to', 'exporter']:
                if field in self.mawb_data:
                    element = ET.SubElement(line_item, f"{{{self.namespaces['entry']}}}{field}")
                    if self.mawb_data[field] is not None:
                        element.text = str(self.mawb_data[field])
                        
        elif container_type == "manifest":
            # Group bill of lading elements
            if any(key in self.mawb_data for key in ['master-scac', 'master-bill', 'house-scac', 'house-bill']):
                bill = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}bill-of-lading")
                for field in ['master-scac', 'master-bill', 'house-scac', 'house-bill', 'quantity', 'unit']:
                    if field in self.mawb_data:
                        element = ET.SubElement(bill, f"{{{self.namespaces['entry']}}}{field}")
                        value = self.mawb_data[field]
                        if value is not None:
                            element.text = str(value)
            
            # Get manifest-type elements
            manifest_fields = self.mapping_df[
                (self.mapping_df['complex'] == 'manifestType') |
                (self.mapping_df['type'] == 'manifestType')
            ]
            
            # Handle non-bill-of-lading fields
            bill_fields = ['master-scac', 'master-bill', 'house-scac', 'house-bill', 'quantity', 'unit']
            manifest_only_fields = [
                field for field in manifest_fields['lvl1_element'].unique() 
                if field not in bill_fields and field in self.mawb_data
            ]
            
            # Add manifest-level elements
            for field in manifest_only_fields:
                if field in self.mawb_data:
                    element = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}{field}")
                    value = self.mawb_data[field]
                    if value is not None:
                        element.text = str(value)

        elif container_type == "consolidated-entries":
            if 'total-manifest-quantity' in self.mawb_data:
                element = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}total-manifest-quantity")
                element.text = str(self.mawb_data['total-manifest-quantity'])
            
            # Group consolidated entry elements
            entry = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}consolidated-entry")
            for field in ['filer-code', 'entry-no']:
                if field in self.mawb_data:
                    element = ET.SubElement(entry, f"{{{self.namespaces['entry']}}}{field}")
                    value = self.mawb_data[field]
                    if value is not None:
                        element.text = str(value)

    def _populate_children(self, parent, current_element, level):
        """
        Helper function to populate direct children under a specific parent element.
        """
        elements = self.mapping_df[
            (self.mapping_df[f'lvl{level}_element'] == current_element) &
            (self.mapping_df[f'lvl{level+1}_element'].notna())
        ]

        for _, row in elements.iterrows():
            child_name = row[f'lvl{level+1}_element']
            if pd.notna(child_name):
                # Create child element
                child_element = ET.SubElement(parent, f"{{{self.namespaces['entry']}}}{child_name}")
                
                # Set value if available in mawb_data
                if child_name in self.mawb_data:
                    value = self.mawb_data[child_name]
                    if value is not None:
                        child_element.text = str(value)
                
                # Check for next level of nesting
                next_level = level + 2
                next_level_col = f'lvl{next_level}_element'
                if next_level_col in self.mapping_df.columns:
                    self._process_element(child_element, child_name, next_level, set())


    def to_string(self):
        return ET.tostring(self.root, encoding='unicode')

    def to_pretty_string(self):
        rough_string = ET.tostring(self.root, encoding='utf-8')
        parsed = ET.fromstring(rough_string)
        return ET.tostring(parsed, pretty_print=True, encoding='unicode')

    async def push_to_netchb(self, xml_str):
        client = Client('https://sandbox.netchb.com/main/services/entry/EntryUploadService?wsdl')
        try:
            response = await asyncio.to_thread(
                client.service.uploadEntry, 'guylichtenstein-sbx', 'Kn2Tech@Miami1!!', xml_str
            )
            return response
        except Exception as e:
            print(f"Error during NetChb API call: {e}")
            return None

    def validate_against_xsd(self, xsd_path):
        try:
            schema = ET.XMLSchema(file=xsd_path)
            xml_str = self.to_string()
            xml_doc = ET.fromstring(xml_str)
            if schema.validate(xml_doc):
                return True
            else:
                raise Exception(f"Schema validation failed: {schema.error_log}")
        except Exception as e:
            raise ValueError(f"Error during XML schema validation: {e}")