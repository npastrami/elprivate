/** @jsxImportSource @emotion/react */ 
import { FC, useContext, Dispatch, SetStateAction } from 'react';
import { Button } from '@mui/material';
import { JobContext } from '../JobInput/JobContext';
import { FileWithID } from './FileSort';
import { FileProcessor } from './FileProcessor';

export const ExtractButton: FC<{ files: FileWithID[], setFiles: Dispatch<SetStateAction<FileWithID[]>> }> = ({ files, setFiles }) => {
  const { clientID, versionID } = useContext(JobContext);

  const handleButtonClick = async () => {
    console.log("handleButtonClick called");
    if (clientID && versionID) {
      const fileProcessor = new FileProcessor(clientID, versionID, files, setFiles);
      await fileProcessor.startProcessing();
    }
  };

  return (
    <div
      css={{
        display: 'flex',
        flexDirection: 'row',
        marginLeft: 'auto',
        marginTop: '20px',
      }}
    >
      <Button
        variant="contained"
        onClick={handleButtonClick}
      >
        Start Extraction Process
      </Button>
    </div>
  );
};