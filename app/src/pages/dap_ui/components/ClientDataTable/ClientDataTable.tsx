import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import { JobContext } from '../JobInput/JobContext';

interface ClientDoc {
  id: number;
  client_id: string;
  doc_name: string;
  doc_status: string;
  doc_type: string;
  access_id: string;
}

interface ExtractedField {
  id: number;
  client_id: string;
  doc_name: string;
  doc_status: string;
  doc_type: string;
  field_name: string;
  field_value: string;
  confidence: number;
  access_id: string;
}

const ClientDataTable: React.FC = () => {
    const { clientID } = useContext(JobContext) as { clientID: string };
    const [clientDocs, setClientDocs] = useState<ClientDoc[]>([]);

    // Extract the data fetching logic into a separate function
    const fetchData = async () => {
      if (!clientID) return;
      try {
        const response = await axios.post("/api/get_client_data", { clientID: clientID });
        const data = JSON.parse(response.data.data);
        setClientDocs(data.client_docs);
      } catch (error) {
        console.error("An error occurred while fetching data:", error);
      }
    };

    return (
      <div>
        <Button variant="contained" color="primary" onClick={fetchData}>
          Load Client Data
        </Button>
      <h2>Client Docs</h2>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client ID</TableCell>
              <TableCell>Document Name</TableCell>
              <TableCell>Doc Status</TableCell>
              <TableCell>Doc Type</TableCell>
              <TableCell>Access Version</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientDocs.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.client_id}</TableCell>
                <TableCell>{row.doc_name}</TableCell>
                <TableCell>{row.doc_status}</TableCell>
                <TableCell>{row.doc_type}</TableCell>
                <TableCell>{row.access_id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ClientDataTable;