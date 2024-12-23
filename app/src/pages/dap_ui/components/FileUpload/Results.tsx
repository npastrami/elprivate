import React, { useState, useEffect, useContext } from 'react';
import { Button, Table, TableBody, TextField, TableCell, TableContainer, TableHead, TableRow, Paper, Switch, FormControlLabel, IconButton } from '@mui/material';
import { ClientDoc } from '../ClientDataTable/ClientDataTable';
import { v4 as uuidv4 } from 'uuid';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RefreshIcon from '@mui/icons-material/Refresh';
import { JobContext } from '../JobInput/JobContext';  // Import the JobContext
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ResultsProps {
  clientId: string; 
}

interface Polygon {
  polygon: number[];
  pageNumber: number;
}

interface Workpaper extends ClientDoc {
  uuid: string;
  field_name: string;
  field_value: string;
  confidence: number;
  doc_url: string;
  field_color: string;
  bounding_box: string;
  approved: boolean;  // Track approval status
}

type SortOrder = 'asc' | 'desc' | null;

const Results: React.FC<ResultsProps> = () => {
  const { clientID } = useContext(JobContext);  // Access clientID from JobContext
  const [workpapers, setWorkpapers] = useState<Workpaper[]>([]);
  const [filteredWorkpapers, setFilteredWorkpapers] = useState<Workpaper[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [docImage, setDocImage] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Workpaper | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [filters, setFilters] = useState<{ [key in keyof Workpaper]?: string }>({});
  const [sendToCatcher, setSendToCatcher] = useState<boolean>(false);
  const [editedFieldsState, setEditedFieldsState] = useState<{ [key: string]: { field_name: string; field_value: string }[] }>({});
  const [boundingBoxes, setBoundingBoxes] = useState<JSX.Element[]>([])
  const [activeField, setActiveField] = useState<string | null>(null);

  const orderedDocUUIDs = Array.from(new Set(workpapers.map(wp => wp.uuid)));

  const loadDocumentsForReview = async () => {
    if (!clientID) {
      alert("Client ID is required to load documents.");
      return;
    }
  
    const response = await fetch('http://127.0.0.1:8080/api/get_documents_for_review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id: clientID }),  // Use clientID from context
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
        approved: doc.doc_status === 'reviewed',  // Reflect 'reviewed' status as 'approved'
      };
    });
  
    setWorkpapers(documentsWithUUID);
    setFilteredWorkpapers(documentsWithUUID);
  
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

  // Sort and filter the workpapers when filters or sorting change
  useEffect(() => {
    let newWorkpapers = [...workpapers];
  
    // Apply other filters
    Object.keys(filters).forEach((key) => {
      const filterValue = filters[key as keyof Workpaper];
      if (filterValue) {
        newWorkpapers = newWorkpapers.filter((workpaper) =>
          String(workpaper[key as keyof Workpaper])
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        );
      }
    });
  
    // Apply sorting
    if (sortColumn && sortOrder) {
      newWorkpapers.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
  
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
  
    setFilteredWorkpapers(newWorkpapers);
  }, [filters, sortColumn, sortOrder, workpapers]);

  const handleSort = (column: keyof Workpaper) => {
    const newSortOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortOrder(newSortOrder);
  };

  const handleFilterChange = (column: keyof Workpaper, value: string) => {
    setFilters({
      ...filters,
      [column]: value,
    });
  };

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

  // const handleFieldValueChange = (index: number, newValue: string) => {
  //   const updatedWorkpapers = [...filteredWorkpapers];
  //   updatedWorkpapers[index].field_value = newValue;

  //   setFilteredWorkpapers(updatedWorkpapers);

  //   const docUUID = updatedWorkpapers[index].uuid;
  //   const fieldName = updatedWorkpapers[index].field_name;

  //   setEditedFieldsState(prevState => {
  //       const updatedDocFields = prevState[docUUID] || [];

  //       // Check if the field is already in the edited fields for this document
  //       const existingFieldIndex = updatedDocFields.findIndex(field => field.field_name === fieldName);

  //       if (existingFieldIndex !== -1) {
  //           // Update the existing field's value
  //           updatedDocFields[existingFieldIndex].field_value = newValue;
  //       } else {
  //           // Add the new field
  //           updatedDocFields.push({
  //               field_name: fieldName,
  //               field_value: newValue
  //           });
  //       }

  //       return {
  //           ...prevState,
  //           [docUUID]: updatedDocFields
  //       };
  //   });
  // };

  const handleApproveDocument = async () => {
    const updatedWorkpapers = [...workpapers];
    const isCurrentlyApproved = updatedWorkpapers[currentDocIndex].approved;
    updatedWorkpapers[currentDocIndex].approved = !isCurrentlyApproved;

    const docUUID = updatedWorkpapers[currentDocIndex].uuid;

    // Retrieve edited fields for this document
    const editedFields = editedFieldsState[docUUID] || [];

    try {
        const response = await fetch('http://127.0.0.1:8080/api/approve_document', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                doc_name: updatedWorkpapers[currentDocIndex].doc_name,
                client_id: clientID,  // Use clientID from context
                approved: !isCurrentlyApproved,  // Send the new approval status
                edited_fields: editedFields  // Send the edited fields
            }),
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        // Remove this document's edits from the tracking state after successful approval
        setEditedFieldsState(prevState => {
            const updatedState = { ...prevState };
            delete updatedState[docUUID];
            return updatedState;
        });

        console.log(`Document approval status updated: ${updatedWorkpapers[currentDocIndex].approved}`);
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

  useEffect(() => {
    const generateBoundingBoxes = () => {
      if (!filteredWorkpapers || filteredWorkpapers.length === 0) return [];
  
      return filteredWorkpapers.map((wp, index) => {
        let boundingBoxData: Polygon[];
        try {
          boundingBoxData = JSON.parse(wp.bounding_box) as Polygon[]; // Parse and assert type
        } catch (error) {
          console.warn('Failed to parse bounding box data:', wp.bounding_box);
          return null;
        }
  
        if (!boundingBoxData || boundingBoxData.length === 0) {
          console.warn('No bounding box data found for:', wp);
          return null;
        }
  
        const polygon = boundingBoxData[0].polygon;
        if (!polygon || polygon.length !== 8) { // Expecting 8 points (4 corners)
          console.warn('Invalid polygon data:', boundingBoxData);
          return null;
        }
  
        const imageElement = document.querySelector('img'); // Assuming the document image is the first <img> element
        if (!imageElement) {
          console.warn('Image element not found');
          return null;
        }
  
        const imgWidth = imageElement.clientWidth;
        const imgHeight = imageElement.clientHeight;
  
        const originalWidth = 8.5; // inches
        const originalHeight = 11; // inches
  
        const scaleX = imgWidth / originalWidth;
        const scaleY = imgHeight / originalHeight;
  
        const top = Math.min(polygon[1], polygon[3], polygon[5], polygon[7]) * scaleY;
        const left = Math.min(polygon[0], polygon[2], polygon[4], polygon[6]) * scaleX;
        const width = (Math.max(polygon[0], polygon[2], polygon[4], polygon[6]) - left / scaleX) * scaleX;
        const height = (Math.max(polygon[1], polygon[3], polygon[5], polygon[7]) - top / scaleY) * scaleY;
  
        return (
          <div key={index} onClick={() => setActiveField(prevActiveField => prevActiveField === wp.field_name ? null : wp.field_name)} style={{
            position: 'absolute',
            border: `2px solid ${wp.field_color}`,
            backgroundColor: wp.field_name === activeField ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            height: `${height}px`,
            zIndex: 2
          }} />
        );
      }).filter(Boolean) as JSX.Element[];
    };
  
    const updateBoundingBoxes = () => {
      const boxes = generateBoundingBoxes();
      setBoundingBoxes(boxes);
    };
  
    const img = document.querySelector('img');
    if (img) {
      img.onload = updateBoundingBoxes;
    }
  
    updateBoundingBoxes(); // Call it directly in case the image is already loaded
  }, [docImage, currentDocIndex, activeField, workpapers, filteredWorkpapers]);

  return (
    <div style={{ display: 'flex', maxHeight: '1000px', width: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, width: '50%', maxHeight: '800px', maxWidth: '1000px', overflowY: 'auto' }}>
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
                    overflow: 'hidden'
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

        <TableContainer component={Paper} style={{ marginBottom: '16px', height: '1000px', maxWidth: '1000px', maxHeight: '500px' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Button onClick={() => handleSort('doc_name')}>Service</Button>
                  <TextField
                    value={filters.doc_name || ''}
                    onChange={(e) => handleFilterChange('doc_name', e.target.value)}
                    placeholder="Search"
                    variant="standard"
                  />
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleSort('approved')}>Documents</Button>
                  <TextField
                    value={filters.approved || ''}
                    onChange={(e) => handleFilterChange('approved', e.target.value)}
                    placeholder="Search"
                    variant="standard"
                  />
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleSort('field_name')}>Status</Button>
                  <TextField
                    value={filters.field_name || ''}
                    onChange={(e) => handleFilterChange('field_name', e.target.value)}
                    placeholder="Search"
                    variant="standard"
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWorkpapers.map((workpaper, index) => (
                <TableRow
                  key={workpaper.uuid + index}
                  onClick={() => setActiveField(workpaper.field_name)} // Set the active field when the row is clicked
                  style={{
                    backgroundColor: workpaper.field_name === activeField ? '#f0f0f0' : 'transparent', // Highlight active row
                  }}
                >
                  <TableCell>{workpaper.doc_name}</TableCell>
                  <TableCell>{workpaper.approved ? 'Reviewed' : 'Extracted'}</TableCell>
                  <TableCell>{workpaper.field_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Button variant="contained" onClick={loadDocumentsForReview}>
          Load Resulting Docs
        </Button>
        <FormControlLabel
          control={
            <Switch
              checked={sendToCatcher}
              onChange={(e) => setSendToCatcher(e.target.checked)}
              color="primary"
            />
          }
          label="Send to Catcher"
        />
      </div>
      <div style={{ flex: 1, marginLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', maxHeight: '700px', maxWidth: '670px', }}>
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
                right: '8px',
                backgroundColor: 'white',
                color: '#4287f5',
                padding: '4px 8px',
                borderRadius: '4px',
                boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',
              }}>
                Downloaded
              </div>
            )}
            <TransformWrapper
              initialScale={1}
              initialPositionX={0}
              initialPositionY={0}
              wheel={{ step: 0.1 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div
                    className="tools"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      display: 'flex',
                      gap: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      padding: '4px',
                      borderRadius: '4px',
                      zIndex: 10,
                    }}
                  >
                    <IconButton
                      onClick={() => zoomIn()}
                      style={{ backgroundColor: '#f0f0f0' }}
                    >
                      <ZoomInIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => zoomOut()}
                      style={{ backgroundColor: '#f0f0f0' }}
                    >
                      <ZoomOutIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => resetTransform()}
                      style={{ backgroundColor: '#f0f0f0' }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </div>
                  <div style={{ overflow: 'auto', width: '100%', height: '100%' }}>
                    <TransformComponent>
                      <img src={docImage} alt="Document" style={{ width: '70%', height: '100%' }} />
                      {boundingBoxes}
                    </TransformComponent>
                  </div>
                </>
              )}
            </TransformWrapper>
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

export default Results;
