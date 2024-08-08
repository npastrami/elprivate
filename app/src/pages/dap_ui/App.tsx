/** @jsxImportSource @emotion/react */

import { useEffect, useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import ClientDataTable from './components/ClientDataTable/ClientDataTable';
import { JobInput } from './components/JobInput';
import { JobProvider } from './components/JobInput/JobContext';
import { FileUpload } from './components/FileUpload';

function App() {
  /** Axcess version will be user input for now. versionID will be removed from here when we can get it from Axcess */

  const krGreen = '#1338BE';
  const [shadowStyle, setShadowStyle] = useState({ left: 0, top: 0, opacity: 0 });

  useEffect(() => {
    const titleElement = document.getElementById('title');

    const handleMouseMove = (event: MouseEvent) => {
      if (titleElement) {
        const { left, top, width, height } = titleElement.getBoundingClientRect();
        if (event.clientX >= left && event.clientX <= left + width && event.clientY >= top && event.clientY <= top + height) {
          const letterWidth = width / titleElement.innerText.length;
          const mouseX = event.clientX - left;
          const letterIndex = Math.floor(mouseX / letterWidth);
          const letterLeft = left + letterWidth * letterIndex;

          setShadowStyle({
            left: letterLeft,
            top: top + height-20,
            opacity: 1,
          });
        } else {
          setShadowStyle((prev) => ({ ...prev, opacity: 0 }));
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      css={{
        backgroundColor: '#f0f0f0',
        width: '100%' // Optional: Change background color
      }}
      sx={{
        maxWidth: 'md'
      }}
    >
      <JobProvider>
        <Container>
          <Box
            id="shadow-box"
            sx={{
              position: 'absolute',
              width: '85px',
              height: '30px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '5px',
              filter: 'blur(10px)',
              pointerEvents: 'none',
              transition: 'left 0.3s ease-out, top 0.3s ease-out, opacity 0.2s ease-out',
              ...shadowStyle,
            }}
          ></Box>
          <Typography
            id="title"
            variant="h1"
            css={{
              color: krGreen,
              textAlign: 'center',
              fontFamily: 'Roboto, sans-serif', // Custom font
              fontWeight: 'bold', // Bold text
              position: 'relative',
              zIndex: 1,
              marginBottom: '20px', // Add some space below the title
            }}
          >
            Enrique's Customs
          </Typography>
          
          <JobInput />

          <Box mb={4}>
            <FileUpload />
          </Box>

          <ClientDataTable />
        </Container>
      </JobProvider>
    </Box>
  );
}

export default App;
