import { useContext, useEffect, useCallback } from 'react';
import { TextField } from '@mui/material';
import { JobContext } from './JobContext';
import AuthService from '../../../../services/auth.service';

export type JobData = {
  clientID?: string;
  versionID?: string;
};

export const JobInput = ({ onEnterKeyPress }: { onEnterKeyPress: (clientID: string) => void }) => {
  const { clientID, versionID, setJobData } = useContext(JobContext);

  const setClientID = useCallback(
    (newClientID: string) => setJobData((prevJobData) => ({ ...prevJobData, clientID: newClientID })),
    [setJobData]
  );

  const setVersionID = useCallback(
    (newVersionID: string) => setJobData((prevJobData) => ({ ...prevJobData, versionID: newVersionID })),
    [setJobData]
  );

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser && currentUser.roles.includes('ROLE_USER')) {
      setClientID(currentUser.id.toString());
    }
  }, [setClientID]);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && clientID) {
      onEnterKeyPress(clientID);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1px', height: '40px' }}>
      <TextField
        label="Client ID"
        value={clientID}
        onChange={e => setClientID(e.target.value)}
        onKeyDown={handleKeyPress} // Attach the key press event
        sx={{
          backgroundColor: '#e0e0e0',
          width: '150px',
          '& .MuiInputBase-root': {
            height: '100%', // Make input fill the height of the div
          },
          '& .MuiInputBase-input': {
            padding: '0 14px', // Vertically center the text
            boxSizing: 'border-box',
          },
          '& .MuiFormLabel-root': {
            top: '-10px', // Adjust the label position for smaller height
          },
        }}
        InputLabelProps={{ sx: { color: '#373737' } }}
        disabled={clientID !== '' && AuthService.getCurrentUser().roles.includes('ROLE_USER')}
      />
      <TextField
        label="Year"
        value={versionID}
        onChange={e => setVersionID(e.target.value)}
        sx={{
          backgroundColor: '#e0e0e0',
          width: '150px',
          '& .MuiInputBase-root': {
            height: '100%', // Make input fill the height of the div
          },
          '& .MuiInputBase-input': {
            padding: '0 14px', // Vertically center the text
            boxSizing: 'border-box',
          },
          '& .MuiFormLabel-root': {
            top: '-10px', // Adjust the label position for smaller height
          },
        }}
        InputLabelProps={{ sx: { color: '#373737' } }}
      />
    </div>
  );
};
