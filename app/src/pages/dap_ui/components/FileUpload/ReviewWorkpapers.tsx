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
  approved: boolean;  // Track approval status
}

const ReviewWorkpapers: React.FC<ReviewWorkpapersProps> = ({ clientId }) => {
  const [workpapers, setWorkpapers] = useState<Workpaper[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [docImage, setDocImage] = useState<string | null>(null);
  const [specificClientId, setSpecificClientId] = useState<string | null>(clientId);
  const [showCurrentDocFields, setShowCurrentDocFields] = useState<boolean>(true); // Preset toggle to "on"

  const orderedDocUUIDs = Array.from(new Set(workpapers.map(wp => wp.uuid)));

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
        approved: false,  // Initial approval status
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
      if (workpapers.length > 0 && currentDocIndex >= 0 && currentDocIndex < workpapers.length) {
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
      }
    };

    if (workpapers.length > 0) {
      loadDocumentImage();
    }
  }, [currentDocIndex, workpapers]);

  // Navigate to the next document in the badge row order
  const handleNextDocument = () => {
    const nextIndex = orderedDocUUIDs.indexOf(workpapers[currentDocIndex].uuid) + 1;
    if (nextIndex < orderedDocUUIDs.length) {
      setCurrentDocIndex(workpapers.findIndex(wp => wp.uuid === orderedDocUUIDs[nextIndex]));
    }
  };

  // Navigate to the previous document in the badge row order
  const handlePreviousDocument = () => {
    const prevIndex = orderedDocUUIDs.indexOf(workpapers[currentDocIndex].uuid) - 1;
    if (prevIndex >= 0) {
      setCurrentDocIndex(workpapers.findIndex(wp => wp.uuid === orderedDocUUIDs[prevIndex]));
    }
  };

  const handleFieldValueChange = (index: number, newValue: string) => {
    const updatedWorkpapers = [...workpapers];
    updatedWorkpapers[index].field_value = newValue;
    setWorkpapers(updatedWorkpapers);
  };

  const handleApproveDocument = async () => {
    const updatedWorkpapers = [...workpapers];
    updatedWorkpapers[currentDocIndex].approved = !updatedWorkpapers[currentDocIndex].approved;

    // Toggle between Approve and Un-Approve
    try {
      await fetch('http://127.0.0.1:8080/api/approve_document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doc_uuid: updatedWorkpapers[currentDocIndex].uuid }),
      });

      setWorkpapers(updatedWorkpapers);
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
            {workpapers.length > 0 && Array.from(new Set(workpapers.map(wp => wp.uuid))).map((uuid) => {
              const docName = workpapers.find(wp => wp.uuid === uuid)?.doc_name || 'Document';
              const isApproved = workpapers.find(wp => wp.uuid === uuid)?.approved || false;
              return (
                <div
                  key={uuid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '30px',
                    width: '100px',
                    backgroundColor: isApproved ? '#4287f5' : (workpapers[currentDocIndex]?.uuid === uuid ? '#d3d3d3' : '#f0f0f0'),
                    borderRadius: '4px',
                    margin: '0 4px',
                    padding: '4px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleDocumentClick(uuid)}
                >
                  <PictureAsPdfIcon style={{ marginRight: '4px', color: isApproved ? '#ffffff' : '#000000' }} />
                  <span style={{ color: isApproved ? '#ffffff' : '#000000' }}>{docName}</span>
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
                      disabled={workpapers[currentDocIndex]?.approved}  // Disable input if approved
                    />
                  </TableCell>
                  <TableCell>{workpaper.confidence}</TableCell>
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
      <div style={{ flex: 1, marginLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        {workpapers.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <strong>Document: {workpapers[currentDocIndex]?.doc_name}</strong>
          </div>
        )}
        {docImage && (
          <div style={{ position: 'relative' }}>
            {workpapers[currentDocIndex]?.approved && (
              <div style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                backgroundColor: 'white',
                color: '#4287f5',
                padding: '4px 8px',
                borderRadius: '4px',
                boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',
              }}>
                Approved
              </div>
            )}
            <img src={docImage} alt="Document" style={{ width: 'auto', height: '800px', maxWidth: '80%' }} />
          </div>
        )}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button variant="contained" onClick={handlePreviousDocument} disabled={currentDocIndex === 0}>
            Previous
          </Button>
          <Button
            variant="contained"
            color={workpapers[currentDocIndex]?.approved ? "secondary" : "primary"}
            onClick={handleApproveDocument}
          >
            {workpapers[currentDocIndex]?.approved ? "Un-Approve" : "Approve"}
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
