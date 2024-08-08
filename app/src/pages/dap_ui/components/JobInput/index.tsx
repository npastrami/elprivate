import { useContext } from 'react';
import { TextField } from '@mui/material';
import { JobContext } from './JobContext';

export type JobData = {
  clientID?: string;
  versionID?: string;
}

export const JobInput = () => {
  const { clientID, versionID, setJobData } = useContext(JobContext);
  const setClientID = (newClientID: string) => setJobData((prevJobData) => ({ ...prevJobData, clientID: newClientID }));
  const setVersionID = (newVersionID: string) => setJobData((prevJobData) => ({ ...prevJobData, versionID: newVersionID }));

  return (
    <>
      <TextField label="Client ID" value={clientID} onChange={e => setClientID(e.target.value)} sx={{ backgroundColor: '#e0e0e0' }} InputLabelProps={{ sx: {color: "#373737"} }} />
      <TextField label="Axcess Version #" value={versionID} onChange={e => setVersionID(e.target.value)} sx={{ backgroundColor: '#e0e0e0' }} InputLabelProps={{ sx: {color: "#373737"} }} />
    </>
  );
}
