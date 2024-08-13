/** @jsxImportSource @emotion/react */
import { useState } from 'react';
import { Container } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { Dropzone } from './Dropzone';
import { FileList } from './FileList';
import { handleSortFiles, FileWithID } from './FileSort';

export enum FileStatus {
  Pending = 'Pending',
  Uploading = 'Uploading...',
  Extracting = 'Extracting...',
  Sorting = 'Sorting...',
  UploadCompleted = 'Upload Completed',
  ExtractCompleted = 'Awaiting Review',
  Error = 'Error',
  EmptyExtraction = 'Empty Extraction'
}

export const FileUpload = () => {
  const [filesToUpload, setFilesToUpload] = useState<FileWithID[]>([]);
  const [selectedFormType, setSelectedFormType] = useState('Pending');

  const handleIdentifier = async (newFiles: File[], formType: string) => {
    const initialFiles: FileWithID[] = newFiles.map((file: File) => {
      const id = uuidv4();
      let status: FileStatus = FileStatus.Pending;
      setSelectedFormType(formType);
      return { file, id, path: file.name, status, formType }; // Now each object is a FileWithID
    });
    const updatedFiles = await handleSortFiles(initialFiles);

    setFilesToUpload(prevFiles => [...prevFiles, ...updatedFiles]);
  };

  const handleRemoveFile = (id: string) => { 
    setFilesToUpload(prevFiles => prevFiles.filter(file => file.id !== id));
  };

  return (
    <>
      <Container
        css={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '2px solid #e4e4e4',
        }}
      >
        <Dropzone onFilesAdded={handleIdentifier} formType={selectedFormType} files={filesToUpload}>
          <FileList files={filesToUpload} onRemove={handleRemoveFile}/>
        </Dropzone>
      </Container>
    </>
  );
}
