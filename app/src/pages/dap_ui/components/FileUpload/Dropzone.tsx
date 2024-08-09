/** @jsxImportSource @emotion/react */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileWithID } from './FileSort';

interface DropzoneProps {
  onFilesAdded: (files: File[], formType: string) => void;
  files: FileWithID[];
  formType: string;
  children?: React.ReactNode;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded, formType, children }) => { 
  const onDrop = useCallback((acceptedFiles: File[]) => {
       onFilesAdded(acceptedFiles, formType);
  }, [onFilesAdded, formType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const explainerText = isDragActive ?
    'Drop the files here ...' :
    'Drag \'n\' drop some files here, or click to select files';

  return (
      <div
        css={{
          color: 'black',
          border: '2px dashed #1338BE',
          borderRadius: '4px',
          padding: '20px',
          margin: '24px 0px 24px 0',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'rgba(98, 148, 131, 0.08)' : ''
        }}
        {...getRootProps()}
        className="dropzone"
      >
        <input {...getInputProps()} />
        { explainerText }
        { children }
      </div>
  );
}

export { Dropzone };
