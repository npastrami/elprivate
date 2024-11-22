sorter_form_mapping = {
    'W2': ['W2', 'Wages'],
    'FlowerInvoice': ['Invoice'],
    'HAWB': ['HAWB', 'Air', 'Waybill', 'Agent'],
    'MAWB': ['Air', 'Waybill', 'Agent'],
}

upload_bucket_mapping = {
    'W2': 'extract-w2',
    'FlowerInvoice': 'extract-custinv',
    'HAWB': 'extract-hawb',
    'MAWB': 'extract-awb',
    'None': 'unsorted',
}

# update with prebuilt 1099 forms on api update
extractor_model_mapping = {
    'W2': 'prebuilt-tax.us.w2',
    'FlowerInvoice': 'enriqueCustoms',
    'HAWB': 'hawbv1',
    'MAWB': 'awbv1',
}

netchb_term_matching = {
    # to-do:
    # 1. get importer company info
    # 2. get cargo manifest query - cmq charge?
    # 3. check for gross weight
    # 4. check for location of goods
    # 5. tariff date calculation
    # 6. check for consolidated entry
    # 7. manufacturer id formula
    # 8. tariff number table
    # 9. System-generated entry-no
    
    # Make entry-no system generated
    "entry-no": "98397699",
    "filer-code": "ABC",
    "check-sum": "1",
    # "system-generated"
    
    # Header Elements
    "importer-tax-id": "12-1234567AB", # importer company info
    "tax-id": "100-20-3000", # importer company info
    "cf-4811": "12-3456789", # importer company info
    "processing-port": "8888", # importer company info
    "consignee-name": "Nicholas Pastrana", # importer company info
    "mode-transportation": "10", # depends on shipping docs air is 40, sea is 10
    "entry-port": "8888", # cargo manifest query
    "entry-type": "01", # for now 01 will always be used
    "entry-date": "2024-11-09", # cargo manifest query
    "payment-type": "2", # importer company info
    "statement-date": "2024-11-09", # always the following friday from the current date, if today is friday then next friday
    "charges": "100", # usually on mawb, if not take gkg*3
    "gross-weight": "200", # depends on if consolidation or not; if consolidation add GKG from all HAWB for that client; if not copy from MAWB
    "description": "COMMERCIAL MERCHANDISE", # take description from anywhere

    # Remote Entry Information - only for Inbonds coming in from another US port 
    # (you probably won't use this yet) (also you can pull this from the cargo manifest queiry) 
    # Ignore for now
    # "preparer-port": "8888",
    # "preparer-office-code": "99",
    # "remote-exam-port": "8888",
    
    # Required Header Elements
    "bond-type": "08", # importer company information
    "surety-code": "123", # importer company information
    "state-destination": "CA", # address of consignee
    "carrier-code": "ABCD", # cargo manifest query
    "location-of-goods": "C213", # this is dificult to get but critical; for Miami stuff look for a previous entry that has the same carrier
    # "paperless-summary-certification": None,  
    # "certify-cargo-release-via-ace": None,
    
    # Missing Docs Code
    "code": "10",  # not in the header page; not sure what this is
    
    # Required dates
    "tariff-calculation-date": "2024-11-09", # Todays date; or date of transmission; or date of arrival; should be the date farthest in the future of those 3 options
    "import-date": "2024-11-09", # upload to netchb date, or today's date
    "arrival-date": "2024-11-09", # cargo manifest query
    # "inbond-date": "2024-11-09",
    
    # Required ports
    "unlading-port": "8888", # can usually be copied from "entry-port"
    
    # Manifest Information
    "total-manifest-quantity": "100", # sum all hawbs for consolidation, mawb, confirm with cargo manifest query
    # "master-scac": "ABCD", # ignore for now
    "master-bill": "123456789012", # only numeric, 11 digits from cmq
    # "house-scac": "ABCD", # ignore for now
    "house-bill": "987654321021", # hawb numbers, cmq
    "quantity": "100", # same as "total-manifest-query"
    "unit": "PCS", # cmq
    
    # Bill of Lading
    # "master-scac": "ABCD", # ignore for now
    "master-bill": "123456789012",
    # "house-scac": "ABCD",
    "house-bill": "987654321021", # hawb numbers, cmq
    "quantity": "100", # same as "total-manifest-query"
    "unit": "PCS", # cmq
    
    # all importer company info:
    "ace_entities": [{
        "entity-code": "BY",
        "entity-name": "BUYER NAME",
        "entity-information": {
            "entity-address": {
                "address-components": [{
                    "component-type": "01",
                    "address-information": "567"
                }, {
                    "component-type": "02",
                    "address-information": "23rd st"
                }],
                "city": "NEW YORK",
                "state-province-code": "NY",
                "postal-code": "10001",
                "country": "US"
            }
        }
    }],
    
    # # Warehouse Entry
    # "warehouse-filer-code": "ABC",
    # "warehouse-entry-no": "1234567",
    # "warehouse-port": "8888",

    # Other Required Elements - importer company information
    "other-recon": "1",
    "bond-amount": "50000",
    "consolidated-informal-indicator": "P",
    "bond-waiver-reason": "995",
    "entry-date-election-code": "P",
    "presentation-date": "2024-11-09",
    
    # Fee information - calculated by netchb
    # "informal-fee": "0.00",
    # "mail-fee": "0.00",
    # "manual-surcharge": "0.00",
    
    # CVD information - ignore for now
    # "add-cvd-bond-type": "08",
    # "add-cvd-stb-amount": "0",
    
    # Boolean flags (as empty elements in XML) - ignore for now, will be human review things
    "electronic-invoice": None,
    "live-entry": None,
    "precalculated": None,
    "transmit": None,
    "via-ace": None,
    
    # Consolidated Entry Information - check for consolidated entry; if more than 1 cosignee on HAWB = consolidation
    "consolidated-entry-no": "99113123",  # Required for consolidated-entry
    "consolidated-entry-filer-code": "ABC", # same as regular entry
    
    # Invoice Information (for invoices/invoice)
    "invoice-no": "12345", # on invoice
    "aii-supplier-id": "SUPPLIER123", # not sure what this is 
    "ultimate-consignee-tax-id": "123-45-7894", # importer company information
    "related-party": "N",  # always no
    "currency-code": "USA", # usually usd, ignore for now
    "country-origin": "CN", # check invoice
    
    # Line Item Required Fields
    "export-date": "2024-11-09",
    "country-origin": "CN",
    "manufacturer-id": "CNMANUFACTURER", # check formula
    "country-export": "CN",  # on awb
    # "lading-port": "12345",  # dont need this yet
    "gross-weight": "200", # on the invoice
    
    # Tariff Information
    "tariff": [{
        "tariff-no": "1234567890", # table for this
        "value": "20", # on invoice
        "quantity1": "10.51", # on invoice
        # "unit-of-measure1": "KG", # netchb provides
        # "special-program": "A", # netchb provides
        # "duty": "2.25" # netchb provides
    },
    {
        # tariff 2 - add more as needed
        # "tariff-no": "1234567891", # table for this
        # "value": "20", # on invoice
        # "quantity1": "10.51", # on invoice
        # "unit-of-measure1": "KG", # netchb provides
        # "special-program": "A", # netchb provides
        # "duty": "2.25" # netchb provides
    }],
    
    # Fees Information -  currently calculated in netchb
    # "fees": [{
    #     "class-code": "056",
    #     "tariff-no": "1234567890",
    #     "amount": "100.45"
    # }],
    
    # Previous entries remain same...
    
    # Party Information - dont know what this is
    # "delivered-to": "DELIVERED",
    # "sold-to": "SOME SELLER", 
    # "exporter": "SOME MFG", 
}
