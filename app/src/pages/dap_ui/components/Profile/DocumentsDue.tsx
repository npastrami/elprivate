import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

type Document = {
  name: string;
  institution: string;
};

type Documents = {
  bankStatements: Document[];
  customsForms: Document[];
  invoices: Document[];
  otherDocuments: Document[];
  taxForms: Document[];
};

type ServiceProject = {
  service_id: string;
  service_type: string;
  documents: Documents;
  notes: string;
  hours_worked: number;
};

type DocumentsDueProps = {
  clientId: string;
  services: ServiceProject[];
};

const DocumentsDue: React.FC<DocumentsDueProps> = ({ clientId, services = [] }) => {
  if (!Array.isArray(services)) {
    return <p>No services available</p>;
  }

  const extractDocuments = (documents: Documents): string[] => {
    const allDocuments = [
      ...documents.bankStatements.map(doc => `Bank Statement: ${doc.institution}`),
      ...documents.customsForms.map(doc => `Customs Form: ${doc.institution}`),
      ...documents.invoices.map(doc => `Invoice: ${doc.institution}`),
      ...documents.otherDocuments.map(doc => `Other Document: ${doc.institution}`),
      ...documents.taxForms.map(doc => `Tax Form: ${doc.institution}`),
    ];
    return allDocuments;
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Service ID</TableCell>
            <TableCell>Service Type</TableCell>
            <TableCell>Documents Required</TableCell>
            <TableCell>Notes</TableCell>
            <TableCell>Hours Worked</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {services.map((project) => (
            <TableRow key={project.service_id}>
              <TableCell>{project.service_id}</TableCell>
              <TableCell>{project.service_type}</TableCell>
              <TableCell>
                <ul>
                  {extractDocuments(project.documents).map((doc, index) => (
                    <li key={index}>{doc}</li>
                  ))}
                </ul>
              </TableCell>
              <TableCell>{project.notes}</TableCell>
              <TableCell>{project.hours_worked}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DocumentsDue;
