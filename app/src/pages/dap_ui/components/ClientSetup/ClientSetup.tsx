import React, { useState, useEffect } from 'react';
import { Button, TextField, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem, Select } from '@mui/material';
import axios from 'axios';  // For API requests
import AuthService from "../../../../services/auth.service";  // Import the AuthService

type Document = {
    name: string;
    institution: string;
};

type DocumentState = {
    institution: string;
    otherDocuments: Document[];
    invoices: Document[];
    bankStatements: Document[];
    customsForms: Document[];
    taxForms: Document[];
};

const customsForms = ["Airway Bill", "House Airway Bill", "Bill of Lading"];
const taxForms = [
    "1099-MISC", "1099-INT", "1099-DIV", "1099-R", "1099-G", "1099-S", 
    "1099-B", "1099-K", "1099-C", "1099-A", "1098", "1098-E", "1098-T", "W-2"
];

const ClientSetup: React.FC = () => {
    const [services, setServices] = useState<any[]>([]);
    const [currentServiceType, setCurrentServiceType] = useState<string>('');
    const [currentDocument, setCurrentDocument] = useState<DocumentState>({
        institution: '',
        otherDocuments: [],
        invoices: [],
        bankStatements: [],
        customsForms: [],
        taxForms: [],
    });
    const [currentNotes, setCurrentNotes] = useState<string>('');
    const [userId, setUserId] = useState<string>('');  // State to store the user_id

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && currentUser.id) {
            setUserId(currentUser.id);  // Set the user ID from the current user
            fetchServices(currentUser.id);
        }
    }, []);

    const fetchServices = async (userId: string) => {
        try {
            const response = await axios.post('http://127.0.0.1:8080/api/get_services', { user_id: userId });
            if (response.status === 200 && response.data.services) {
                // Parse the JSON string into a JavaScript object
                let servicesData = response.data.services;
    
                if (typeof servicesData === 'string') {
                    servicesData = JSON.parse(servicesData);
                }
    
                // Convert the services object into an array
                const servicesArray = Object.entries(servicesData).flatMap(([serviceType, servicesList]) => {
                    const typedServicesList = servicesList as Array<any>;
                    return typedServicesList.map((service) => ({
                        service_type: serviceType,
                        ...service,
                    }));
                });
    
                setServices(servicesArray);
            } else {
                setServices([]);  // If no services found, set to an empty array
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            setServices([]);  // In case of an error, set services to an empty array
        }
    };

    const handleAddService = async () => {
        if (!currentServiceType) {
            alert('Please select a service type.');
            return;
        }

        const newService = {
            service_type: currentServiceType,
            documents: currentDocument,
            notes: currentNotes,
        };

        try {
            const response = await axios.post('http://127.0.0.1:8080/api/add_service', {
                user_id: userId, // Use user ID instead of username
                service_type: currentServiceType,
                documents: currentDocument,
                notes: currentNotes,
            });

            if (response.status === 201) {
                setServices([...services, newService]);
                alert(`Service added successfully! Service ID: ${response.data.service_id}`);
            } else {
                alert('Failed to add service');
            }
        } catch (error) {
            console.error('Error adding service:', error);
            alert('Error adding service');
        }

        // Reset form
        setCurrentServiceType('');
        setCurrentDocument({
            institution: '',
            otherDocuments: [],
            invoices: [],
            bankStatements: [],
            customsForms: [],
            taxForms: [],
        });
        setCurrentNotes('');
    };

    const handleAddDocument = (type: keyof DocumentState, formName: string = '') => {
        if (!currentDocument.institution) {
            alert('Please enter an institution name before adding documents.');
            return;
        }
    
        const newDocument = {
            name: formName || `${type} document`,
            institution: currentDocument.institution,
        };
    
        setCurrentDocument((prev: DocumentState) => ({
            ...prev,
            [type]: [...(prev[type] as Document[]), newDocument],  // Add the new document to the array
        }));
    };

    return (
        <div>
            <Card style={{ padding: '16px', marginBottom: '16px' }}>
                <div>
                    <TextField
                        label="Select Service Type"
                        select
                        value={currentServiceType}
                        onChange={(e) => setCurrentServiceType(e.target.value)}
                        SelectProps={{
                            native: true,
                        }}
                        variant="outlined"
                        fullWidth
                        margin="normal"
                    >
                        <option value=""></option>
                        <option value="Customs">Customs</option>
                        <option value="Tax">Tax</option>
                        <option value="Book Keeping">Bookkeeping</option>
                    </TextField>
    
                    <TextField
                        label="Institution Name"
                        value={currentDocument.institution}
                        onChange={(e) =>
                            setCurrentDocument({
                                ...currentDocument,
                                institution: e.target.value,
                            })
                        }
                        variant="outlined"
                        fullWidth
                        margin="normal"
                    />
    
                    <Button variant="outlined" color="primary" onClick={() => handleAddDocument('invoices')} style={{ marginRight: '8px' }}>
                        Add Invoice
                    </Button>
    
                    <Button variant="outlined" color="primary" onClick={() => handleAddDocument('bankStatements')} style={{ marginRight: '8px' }}>
                        Add Bank/Credit Card Statement
                    </Button>
    
                    <Select
                        displayEmpty
                        defaultValue=""
                        onChange={(e) => handleAddDocument('customsForms', e.target.value as string)}
                        variant="outlined"
                        style={{ marginRight: '8px', paddingBottom: '3px', maxHeight: '38px' }}
                    >
                        <MenuItem value="" disabled>Add Customs Form</MenuItem>
                        {customsForms.map((form, index) => (
                            <MenuItem key={index} value={form}>{form}</MenuItem>
                        ))}
                    </Select>
    
                    <Select
                        displayEmpty
                        defaultValue=""
                        onChange={(e) => handleAddDocument('taxForms', e.target.value as string)}
                        variant="outlined"
                        style={{ marginRight: '8px', paddingBottom: '3px', maxHeight: '38px' }}
                    >
                        <MenuItem value="" disabled>Add Tax Form</MenuItem>
                        {taxForms.map((form, index) => (
                            <MenuItem key={index} value={form}>{form}</MenuItem>
                        ))}
                    </Select>
    
                    <Button variant="outlined" color="primary" onClick={() => handleAddDocument('otherDocuments')}>
                        Add Other Document
                    </Button>
    
                    <Card style={{ marginTop: '16px', padding: '16px' }}>
                        <div>
                            {currentDocument.invoices.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0px' }}>
                                    <strong style={{ marginRight: '8px' }}>Invoices:</strong>
                                    {currentDocument.invoices.map((doc: Document, index: number) => (
                                        <div 
                                            key={index} 
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                backgroundColor: '#FF4D00',
                                                color: '#fff',
                                                borderRadius: '12px',
                                                padding: '0 8px',
                                                maxWidth: '150px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {doc.institution}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {currentDocument.bankStatements.length > 0 && (
                                <div style={{ display: 'flex', marginTop:'6px', alignItems: 'center', flexWrap: 'wrap', gap: '0px' }}>
                                    <strong style={{ marginRight: '8px' }}>Bank/Credit Card Statements:</strong>
                                    {currentDocument.bankStatements.map((doc: Document, index: number) => (
                                        <div 
                                            key={index} 
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                backgroundColor: '#009E60',
                                                color: '#fff',
                                                borderRadius: '12px',
                                                padding: '0 8px',
                                                maxWidth: '150px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {doc.institution}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {currentDocument.customsForms && currentDocument.customsForms.length > 0 && (
                                <div style={{ display: 'flex', marginTop:'6px', alignItems: 'center', flexWrap: 'wrap', gap: '0px' }}>
                                    <strong style={{ marginRight: '8px' }}>Customs Forms:</strong>
                                    {currentDocument.customsForms.map((doc: Document, index: number) => (
                                        <div 
                                            key={index} 
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                backgroundColor: '#FF8C00',
                                                color: '#fff',
                                                borderRadius: '12px',
                                                padding: '0 8px',
                                                maxWidth: '150px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {doc.institution}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {currentDocument.taxForms && currentDocument.taxForms.length > 0 && (
                                <div style={{ display: 'flex', marginTop:'6px', alignItems: 'center', flexWrap: 'wrap', gap: '0px' }}>
                                    <strong style={{ marginRight: '8px' }}>Tax Forms:</strong>
                                    {currentDocument.taxForms.map((doc: Document, index: number) => (
                                        <div 
                                            key={index} 
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                backgroundColor: '#1ed2ff',
                                                color: '#fff',
                                                borderRadius: '12px',
                                                padding: '0 8px',
                                                maxWidth: '150px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {doc.institution}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {currentDocument.otherDocuments.length > 0 && (
                                <div style={{ display: 'flex', marginTop:'6px', alignItems: 'center', flexWrap: 'wrap', gap: '0px' }}>
                                    <strong style={{ marginRight: '8px' }}>Other Documents:</strong>
                                    {currentDocument.otherDocuments.map((doc: Document, index: number) => (
                                        <div 
                                            key={index} 
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                backgroundColor: '#FF0000',
                                                color: '#fff',
                                                borderRadius: '12px',
                                                padding: '0 8px',
                                                maxWidth: '150px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {doc.institution}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
    
                    <TextField
                        label="Add Notes"
                        value={currentNotes}
                        onChange={(e) => setCurrentNotes(e.target.value)}
                        variant="outlined"
                        multiline
                        rows={4}
                        fullWidth
                        margin="normal"
                    />
    
                    <Button variant="contained" color="primary" onClick={handleAddService} fullWidth>
                        Add Service
                    </Button>
                </div>
            </Card>
    
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Service ID</TableCell>
                            <TableCell>Service Type</TableCell>
                            <TableCell>Documents Required</TableCell>
                            <TableCell>Notes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {services.map((service, index) => {
                            const documents = service.documents || {};

                            const allDocuments = [
                                ...(documents.invoices || []),
                                ...(documents.bankStatements || []),
                                ...(documents.customsForms || []),
                                ...(documents.taxForms || []),
                                ...(documents.otherDocuments || [])
                            ];

                            return (
                                <TableRow key={index}>
                                    <TableCell style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        {service.service_id || 'N/A'}
                                    </TableCell>
                                    <TableCell style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        {service.service_type ? service.service_type.toUpperCase() : 'N/A'}
                                    </TableCell>
                                    <TableCell style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        {allDocuments.length > 0 ? (
                                            <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                                {allDocuments.map((doc, idx) => (
                                                    <li key={idx} style={{ listStyleType: 'disc' }}>{doc.institution}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            'No documents'
                                        )}
                                    </TableCell>
                                    <TableCell style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        {service.notes || 'No notes'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default ClientSetup;
