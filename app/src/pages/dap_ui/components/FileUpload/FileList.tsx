/** @jsxImportSource @emotion/react */

import { FC, useContext } from "react";
import { Grid, IconButton, Button, Typography, Select, MenuItem } from "@mui/material";
import { useState, useEffect } from "react";
import { FileWithID } from "./FileSort";
import { TrashCanIcon } from "./TrashCanIcon";
import { JobContext } from "../JobInput/JobContext";
import { ExtractButton } from "./ExtractButton";
import GetAppIcon from '@mui/icons-material/GetApp';

interface FileListProps {
  files: FileWithID[];
  onRemove: (id: string) => void;
}

export const FileList: FC<FileListProps> = ({ files, onRemove }) => {
  const [localFiles, setLocalFiles] = useState<FileWithID[]>(files);

  // State to track if all files are extracted
  const [allExtracted, setAllExtracted] = useState(false);

  useEffect(() => {
    // Check if all files have status 'Extract Completed'
    const allFilesExtracted = localFiles.every(file => file.status === 'Extract Completed');
    setAllExtracted(allFilesExtracted);
  }, [localFiles]);

  // Sync localFiles with files prop
  useEffect(() => {
    console.log("Files from props:", files);
    setLocalFiles(files);
  }, [files]);

  const { clientID, versionID } = useContext(JobContext);

  if (!clientID) return <div>Please enter a client ID</div>;
  if (!versionID) return <div>Please enter a version ID</div>;

  if (files.length === 0) return null;

  // as const is used to make TypeScript treat formTypes as a readonly tuple, not a regular array.
  const formTypes = ["None", "W2", "Customs"] as const;

  // typeof formTypes[number] then creates a union type of the values in formTypes, which is equivalent to the original FormType type.
  // This allows us to use the formTypes array to define the type of a variable, but also use the type of the values in the array elsewhere.
  type FormType = typeof formTypes[number];

  const updateFormType = (id: string, formType: FormType) => {
    setLocalFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === id ? { ...file, formType } : file
      )
    );
  };
  
  const handleDownload = async (documentName: string, clientID: string) => {
    console.log("Download button clicked");
    const response = await fetch(`http://127.0.0.1:8080/api/download_csv/${documentName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientID })
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentName}.csv`;
    a.click();
  };

  const handleDownloadAll = async (clientID: string) => {
    const documentNames = localFiles.map(file => file.path);
    const response = await fetch('http://127.0.0.1:8080/api/download_all_documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientID, documentNames }) // Pass the array of document names
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientID}_FOF_Data.xlsx`; // Change file extension to xlsx
    a.click();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      css={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        css={{
          maxHeight: "300px",
          width: "705px",
          overflowY: "auto",
        }}
      >
        <div css={{ display: "flex", flexDirection: "column" }}>
          <Grid container>
            <Grid item xs={4}>
              <Typography variant="subtitle1">File Name</Typography>
            </Grid>

            <Grid item xs={2}>
              <Typography variant="subtitle1">File Size</Typography>
            </Grid>

            <Grid item xs={2}>
              <Typography variant="subtitle1">Status</Typography>
            </Grid>

            <Grid item xs={2}>
              <Typography variant="subtitle1">Form</Typography>
            </Grid>

            <Grid item xs={2}>
              <Typography variant="subtitle1"></Typography>
            </Grid>
          </Grid>
          {localFiles.map((file) => (
            <div
              key={file.id}
              css={{
                display: "flex",
                flexDirection: "row",
                flexGrow: 1,
                backgroundColor: "#f3f3f3",
                borderRadius: "8px",
                padding: "0px 8px 0px 8px",
                margin: "2px 0px 0px 2px",
              }}
            >
              <Grid container>
                <Grid item xs={4}>
                  <Typography variant="subtitle1">{file.path}</Typography>
                </Grid>

                <Grid item xs={2}>
                  <Typography variant="subtitle1">{file.file.size}</Typography>
                </Grid>

                <Grid item xs={2}>
                <Typography variant="subtitle1" style={{color: file.status === "Empty Extraction" ? "red" : "inherit"}}>
                  {file.status}
                </Typography>
                </Grid>

                <Grid item xs={2.3}>
                  {/* create a drop down with multiple selects Form, None, W2 */}
                  <Select
                    variant="outlined"
                    defaultValue="None"
                    value={file.formType}
                    css={{ 
                      width: "100%",
                      height: "35px", 
                      backgroundColor: "white",
                      borderRadius: "12px",  // Rounded edges
                      "& .MuiOutlinedInput-root": {  // Style for the outline
                        borderRadius: "12px"
                      },
                      "& .MuiOutlinedInput-input": {  // Style for the input to adjust height
                        padding: "10px 14px"
                      }
                    }}
                    onChange={(e) => updateFormType(file.id, e.target.value as FormType)}
                    MenuProps={{
                      classes: { paper: "menu-paper" },  // Custom class for the paper component
                    }}
                  >
                    {formTypes.map((formType) => (
                      <MenuItem key={formType} value={formType}>{formType}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={0.85}>
                  <IconButton onClick={() => onRemove(file.id)}>
                    <TrashCanIcon />
                  </IconButton>
                </Grid>
                <Grid item xs={0.85}>
                  {file.status === 'Extract Completed' && (
                    <IconButton style={{ color: '#ABABAB' }} onClick={() => handleDownload(file.file.name, clientID)}>
                      <GetAppIcon />
                    </IconButton>
                  )}
                </Grid>
              </Grid>
            </div>
          ))}
        </div>
      </div>
      <div css={{ display: 'flex', flexDirection: 'row', marginLeft: 'auto', marginTop: '20px' }}>
        {/* Download All Button */}
        <Button
          variant="contained"
          onClick={(_e) => handleDownloadAll(clientID)}
          disabled={!allExtracted} // Disable button if not all files are extracted
          style={{ marginRight: '10px',
          height: '36px', 
          minWidth: '200px', marginTop: '20px' }}
        >
          Download All
        </Button>

        {/* Existing Extract Button */}
        <ExtractButton files={localFiles} setFiles={setLocalFiles} />
      </div>
    </div>
  );
};
