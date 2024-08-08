sorter_form_mapping = {
    'W2': ['W2', 'Wages'],
    'Customs': ['Invoice', 'Customs'],
    'None': 'unsorted',
}

upload_bucket_mapping = {
    'W2': 'extract-w2',
    'Customs': 'extract-custinv',
    'None': 'unsorted',
}

# update with prebuilt 1099 forms on api update
extractor_model_mapping = {
    'W2': 'prebuilt-tax.us.w2',
    'Customs': 'enriqueCustoms',
    'None': 'unsorted',
}

netchb_term_matching = {
    'Field1': 'MappedField1',
    'Field2': 'MappedField2',
}