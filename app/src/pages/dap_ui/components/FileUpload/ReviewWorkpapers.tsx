import React, { useState, useEffect } from 'react';
import { Button, Table, TableBody, TextField, TableCell, TableContainer, TableHead, TableRow, Paper, Switch, FormControlLabel, IconButton } from '@mui/material';
import { ClientDoc } from '../ClientDataTable/ClientDataTable';
import { v4 as uuidv4 } from 'uuid';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface ReviewWorkpapersProps {
  clientId: string;
}

interface Workpaper extends ClientDoc {
  uuid: string;
  field_name: string;
  field_value: string;
  confidence: number;
  doc_url: string;
}

const ReviewWorkpapers: React.FC<ReviewWorkpapersProps> = ({ clientId }) => {
  const [workpapers, setWorkpapers] = useState<Workpaper[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [docImage, setDocImage] = useState<string | null>(null);
  const [specificClientId, setSpecificClientId] = useState<string | null>(clientId);
  const [showCurrentDocFields, setShowCurrentDocFields] = useState(false);

  const loadDocumentsForReview = async () => {
    const response = await fetch('http://127.0.0.1:8080/api/get_documents_for_review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id: specificClientId, doc_status: 'extracted' }),
    });
    const data = await response.json();

    const docUrlToUuidMap: Record<string, string> = {};

    const documentsWithUUID = data.documents.map((doc: Workpaper) => {
      if (!docUrlToUuidMap[doc.doc_url]) {
        docUrlToUuidMap[doc.doc_url] = uuidv4(); // Assign a UUID to each unique doc_url
      }

      return {
        ...doc,
        uuid: docUrlToUuidMap[doc.doc_url], // Use the same UUID for fields with the same doc_url
      };
    });

    setWorkpapers(documentsWithUUID);

    if (documentsWithUUID.length > 0) {
      setCurrentDocIndex(0); // Reset to the first document
    } else {
      setDocImage(null); // Clear the image if no documents are found
    }
  };

  // Load document image whenever the current document changes
  useEffect(() => {
    const loadDocumentImage = async () => {
      const docName = workpapers[currentDocIndex]?.doc_name;
      if (docName) {
        setDocImage(null); // Clear the previous image before loading a new one
        const response = await fetch('http://127.0.0.1:8080/api/get_document_image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ doc_name: docName }),
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          
          setDocImage(url); // Set the new object URL
        } else {
          console.error("Failed to load document image:", response.statusText);
        }
      }
    };

    if (workpapers.length > 0) {
      loadDocumentImage();
    }
  }, [currentDocIndex, workpapers]);

  const handleNextDocument = () => {
    if (currentDocIndex < workpapers.length - 1) {
      setCurrentDocIndex(currentDocIndex + 1);
    }
  };

  const handlePreviousDocument = () => {
    if (currentDocIndex > 0) {
      setCurrentDocIndex(currentDocIndex - 1);
    }
  };

  const handleFieldValueChange = (index: number, newValue: string) => {
    const updatedWorkpapers = [...workpapers];
    updatedWorkpapers[index].field_value = newValue;
    setWorkpapers(updatedWorkpapers);
  };

  const handleApproveDocument = async () => {
    const currentDocUUID = workpapers[currentDocIndex].uuid;

    try {
      await fetch('http://127.0.0.1:8080/api/approve_document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doc_uuid: currentDocUUID }),
      });

      alert('Document approved successfully.');
    } catch (error) {
      console.error('Error approving document:', error);
      alert('Failed to approve document.');
    }
  };

  const handleDocumentClick = (uuid: string) => {
    const index = workpapers.findIndex(wp => wp.uuid === uuid);
    if (index !== -1) {
      setCurrentDocIndex(index);
    }
  };

  const filteredWorkpapers = showCurrentDocFields
    ? workpapers.filter((workpaper) => workpaper.uuid === workpapers[currentDocIndex]?.uuid)
    : workpapers;

  return (
    <div style={{ display: 'flex', maxHeight: '1200px', width: '100%' }}>
      <div style={{ flex: 1, width: '50%', maxHeight: '800px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <IconButton onClick={handlePreviousDocument} disabled={currentDocIndex === 0}>
            <ArrowBackIosIcon />
          </IconButton>
          <div style={{ display: 'flex', overflowX: 'auto', maxWidth: '80%' }}>
            {Array.from(new Set(workpapers.map(wp => wp.uuid))).map((uuid) => {
              const docName = workpapers.find(wp => wp.uuid === uuid)?.doc_name || 'Document';
              return (
                <div
                  key={uuid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '30px',
                    width: '100px',
                    backgroundColor: workpapers[currentDocIndex].uuid === uuid ? '#d3d3d3' : '#f0f0f0',
                    borderRadius: '4px',
                    margin: '0 4px',
                    padding: '4px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleDocumentClick(uuid)}
                >
                  <PictureAsPdfIcon style={{ marginRight: '4px' }} />
                  <span>{docName}</span>
                </div>
              );
            })}
          </div>
          <IconButton onClick={handleNextDocument} disabled={currentDocIndex === workpapers.length - 1}>
            <ArrowForwardIosIcon />
          </IconButton>
        </div>

        <FormControlLabel
          control={<Switch checked={showCurrentDocFields} onChange={() => setShowCurrentDocFields(!showCurrentDocFields)} />}
          label="Show Only Fields for Current Document"
          style={{ marginBottom: '8px' }}
        />
        <TableContainer component={Paper} style={{ marginBottom: '16px', height: '100%' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Document Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Field Name</TableCell>
                <TableCell>Field Value</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Approve</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWorkpapers.map((workpaper, index) => (
                <TableRow key={workpaper.uuid + index}>
                  <TableCell>{workpaper.doc_name}</TableCell>
                  <TableCell>{workpaper.doc_status}</TableCell>
                  <TableCell>{workpaper.field_name}</TableCell>
                  <TableCell>
                    <TextField
                      value={workpaper.field_value}
                      onChange={(e) => handleFieldValueChange(index, e.target.value)}
                      variant="outlined"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>{workpaper.confidence}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleApproveDocument}
                      disabled={!showCurrentDocFields || workpaper.uuid !== workpapers[currentDocIndex].uuid}
                    >
                      Approve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TextField
          label="Review Client ID"
          variant="outlined"
          value={specificClientId || ''}
          onChange={(e) => setSpecificClientId(e.target.value)}
          fullWidth
          style={{ marginBottom: '16px' }}
        />
        <Button variant="contained" onClick={loadDocumentsForReview}>
          Load Review Docs
        </Button>
      </div>
      <div style={{ flex: 1, marginLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {workpapers.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <strong>Document: {workpapers[currentDocIndex]?.doc_name}</strong>
          </div>
        )}
        {docImage && (
          <img src={docImage} alt="Document" style={{ width: 'auto', height: '800px', maxWidth: '80%' }} />
        )}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button variant="contained" onClick={handlePreviousDocument} disabled={currentDocIndex === 0}>
            Previous
          </Button>
          <Button variant="contained" onClick={handleNextDocument} disabled={currentDocIndex === workpapers.length - 1}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewWorkpapers;