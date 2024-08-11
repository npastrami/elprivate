import { FileStatus } from './index';

export interface FileWithID {
  file: File;
  id: string;
  path?: string | undefined;
  status: FileStatus;
  formType?: string;
}

export const handleSortFiles = async (files: FileWithID[]) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files[]", file.file);
  });

  console.log("Making POST request to /api/sort");

  const response = await fetch('http://127.0.0.1:8080/api/sort', {
    method: 'POST',
    body: formData,
  });

  console.log(response)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Update files with formType
  const updatedFiles = files.map((file, index) => {
    if (data.sorted_files[index]) {
      return { ...file, formType: data.sorted_files[index].form_type };
    }
    return file;
  });

  return updatedFiles;
};