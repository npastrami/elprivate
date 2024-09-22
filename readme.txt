Document Automation Pipeline - Root Readme

### to download backend dependencies, naviage to /api and run:
### pip install -r requirements.txt
### to launch, run python3 main.py
###
### to download frontend packages, naviate to /app and run:
### npm install, yarn install
### to launch, run npm start


--- In /api you will find /accounts, of which where resides the code for the account handling and auth logic on the backend.
	/accounts has:
		/config - handles account config
		/controllers - handles logic of how the account can interact with other backend components?
		/middleware - verifies role, token, and no duplicate accounts
		/models - handles account attributes and instantiation in the database.
		/routes - handles auth of user privilege for routed requests.


--- Next, you will find /dap, d.a.p. is short for document automation pipeline.
	In /dap you will find:
		/axcess - tax prep software api connection module (software is CCH Axcess, plan to replace with UsTaxes open-source implementation.
		/azure - holds sorter.py, uploader.py, extractor.py, and catcher.py. Handles azure storage and document intelligence services for ETL automation services.
		/netchb - holds netchb_86entry_xml_builder.py & netchb_ams_xml_builder.py and netchb_api_push.py to handle building of specific xml formatting options and post+get from the 			  api server.
		/csv - lastly this folder holds a main FOFexport.py file that's been adapted for customs formatted excel rendering of the workpapers. There are a handle_duplicates.py file 		       and refresh.py file meant for use with the database which currently I believe are unused but we may want to use again in the future.


--- Finally, in /api you will find /database, inside are:
		/dapdatabase.py - 
		/accountdatabase.py - 

--- Loose in /api you will find a form_mapping_utils file which as the name implies, holds the dictionaries for mapping key words, form types, and cloud endpoint urls. The other loose file is credentials.py.