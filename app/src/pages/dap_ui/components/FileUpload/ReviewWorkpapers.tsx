import React, { useState, useEffect } from 'react';
import { Button, Table, TableBody, TextField, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ClientDoc } from '../ClientDataTable/ClientDataTable';

interface ReviewWorkpapersProps {
  clientId: string;
}

interface Workpaper extends ClientDoc {
  field_name: string;
  field_value: string;
  confidence: number;
}

const ReviewWorkpapers: React.FC<ReviewWorkpapersProps> = ({ clientId }) => {
  const [workpapers, setWorkpapers] = useState<Workpaper[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [docImage, setDocImage] = useState<string | null>(null);
  const [specificClientId, setSpecificClientId] = useState<string | null>(clientId);

  const loadDocumentsForReview = async () => {
    const response = await fetch('http://127.0.0.1:8080/api/get_documents_for_review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id: specificClientId, doc_status: 'Awaiting Review' }),
    });
    const data = await response.json();
    setWorkpapers(data.documents);
    if (data.documents.length > 0) {
      setCurrentDocIndex(0); // Reset to the first document
    } else {
      setDocImage(null); // Clear the image if no documents are found
    }
  };

  // Load document image whenever the current document changes
  useEffect(() => {
    if (workpapers.length > 0) {
      const loadDocumentImage = async () => {
        const docName = workpapers[currentDocIndex].doc_name;
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
                setDocImage(url);
            } else {
                console.error("Failed to load document image:", response.statusText);
            }
        };

        loadDocumentImage();
    }
  }, [currentDocIndex, workpapers]);

  const handleNextDocument = () => {
    if (currentDocIndex < workpapers.length - 1) {
      const newIndex = currentDocIndex + 1;
      setCurrentDocIndex(newIndex);
    }
  };

  const handlePreviousDocument = () => {
    if (currentDocIndex > 0) {
      const newIndex = currentDocIndex - 1;
      setCurrentDocIndex(newIndex);
    }
  };

  const handleFieldValueChange = (index: number, newValue: string) => {
    const updatedWorkpapers = [...workpapers];
    updatedWorkpapers[index].field_value = newValue;
    setWorkpapers(updatedWorkpapers);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ flex: 1 }}>
        <TableContainer component={Paper} style={{ marginBottom: '16px' }}>
          <Table>
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
              {workpapers.map((workpaper, index) => (
                <TableRow key={workpaper.doc_name}>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TextField
          label="Specific Client ID"
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
      <div style={{ flex: 1, marginLeft: '0px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {docImage && (
          <img src={docImage} alt="Document" style={{ width: 'auto', height: 'auto', maxWidth: '40%' }} />
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
