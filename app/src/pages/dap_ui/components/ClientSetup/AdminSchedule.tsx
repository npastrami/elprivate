import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Grid, Card, Typography, IconButton, Box, Autocomplete, TextField, Paper, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AuthService from '../../../../services/auth.service';

type ServiceProject = {
  service_id: string;
  client_id: string;
  service_type: string;
  form_type: string;
  institution_name: string;
  documents_required: any; // JSONB field containing form types and institution names
  notes: string;
  hours_worked: number;
  status: string;
  assigned_admin_id: string | null;
};

type Admin = {
  id: string;
  name: string;
};

// const statuses = ['Backlog', 'Ready', 'In-Progress', 'Review', 'Done'];

const headerStyles: { [key: string]: string } = {
  Ready: '#1976d2', // Blue
  InProgress: '#ff9800', // Orange
  Review: '#f44336', // Red
  Done: '#4caf50', // Green
};

const AdminSchedule: React.FC = () => {
  const [columns, setColumns] = useState<{ [key: string]: ServiceProject[] }>({});
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showBacklog, setShowBacklog] = useState(false);
  const [editable, setEditable] = useState<{ [key: string]: boolean }>({});

  // Fetch service projects and initialize columns
  const fetchServiceProjects = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8080/api/get_service_projects', {
        headers: {
          'x-access-token': AuthService.getCurrentUser()?.accessToken,
        },
      });
      if (response.data.service_projects) {
        const projects = response.data.service_projects;
        console.log(response.data.service_projects)
        const newColumns: { [key: string]: ServiceProject[] } = {
          Ready: [],
          InProgress: [],
          Review: [],
          Done: [],
        };
  
        // Ensure we are correctly organizing the projects by their status
        projects.forEach((project: ServiceProject) => {
          if (project.status && newColumns[project.status]) {
            newColumns[project.status].push(project);
          }
        });
  
        // Set columns to reflect the updated organization
        setColumns(newColumns);
      }
    } catch (error) {
      console.error('Error fetching service projects:', error);
    }
  }, []);

  // Fetch list of admins (users whose ID starts with 'X') for assignment
  const fetchAdmins = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8080/api/get_admins', {
        headers: {
          'x-access-token': AuthService.getCurrentUser()?.accessToken,
        },
      });
  
      // Ensure response data has admins and check its structure
      const admins = response?.data?.admins;
      console.log(admins)
      if (admins && Array.isArray(admins)) {
        const filteredAdmins = admins.filter((admin: Admin) => admin.id && admin.id.startsWith('X'));
        setAdmins(filteredAdmins);
      } else {
        console.error('Error: Admin data is not in the expected format', response?.data);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  useEffect(() => {
    fetchServiceProjects();
    fetchAdmins();
  }, [fetchServiceProjects]);

  const updateServiceProject = async (service_id: string, updates: any) => {
    try {
      await axios.post(
        'http://127.0.0.1:8080/api/update_service_project',
        updates,
        { headers: { 'x-access-token': AuthService.getCurrentUser()?.accessToken } }
      );
      fetchServiceProjects(); // Re-fetch to reflect changes
    } catch (error) {
      console.error('Error updating service project:', error);
    }
  };

  const handleEditClick = (service_id: string) => {
    setEditable((prevEditable) => ({
      ...prevEditable,
      [service_id]: !prevEditable[service_id],
    }));
  };

  const handleSaveClick = async (service_id: string, notes: string, assignedAdmin: string | null) => {
    if (window.confirm('Confirm save of edits to database?')) {
      const updates = {
        service_id,
        notes: notes || '', // Ensure notes is not null
        assigned_admin_id: assignedAdmin || '' // Ensure assigned_admin_id is not null
      };
      await updateServiceProject(service_id, updates);
    }
    setEditable((prevEditable) => ({
      ...prevEditable,
      [service_id]: false,
    }));
  };

  // Parse form types and institution names from the JSONB field
  const parseDocuments = (documents: any): string => {
    const documentList: string[] = []; // Explicitly define documentList as a string array
  
    if (documents) {
      Object.keys(documents).forEach((key) => {
        if (Array.isArray(documents[key]) && documents[key].length > 0) {
          documents[key].forEach((doc: { name: string; institution: string }) => {
            if (doc && doc.name && doc.institution) {
              documentList.push(`${doc.name} (${doc.institution})`);
            }
          });
        }
      });
    }
  
    return documentList.join(', '); // Return the formatted document list as a single string
  };

  // Drag and drop logic
  const handleDrop = (service_id: string, newStatus: string) => {
    updateServiceProject(service_id, { service_id, status: newStatus });
  };

  const DraggableCard: React.FC<{ project: ServiceProject }> = ({ project }) => {
    console.log('Rendering project:', project); // Log project data
    const [notes, setNotes] = useState<string>(project.notes);
    const [assignedAdmin, setAssignedAdmin] = useState<string | null>(project.assigned_admin_id);
    const isEditable = editable[project.service_id] || false;
    const documentsList = parseDocuments(project.documents_required);

    const [, drag] = useDrag({
      type: 'CARD',
      item: { service_id: project.service_id },
    });

    return (
      <Card ref={drag} sx={{ p: 2, mb: 2, width: '300px', height: '300px', position: 'relative' }}>
        <Typography><strong>Service Type:</strong> {project.service_type}</Typography>
        <Typography><strong>Form Types:</strong> {documentsList}</Typography>
        <Typography><strong>Institution:</strong> {project.institution_name}</Typography>

        {/* Editable Notes Input */}
        <TextField
          label="Notes"
          multiline
          maxRows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          variant="outlined"
          sx={{ width: '100%' }}
          disabled={!isEditable}
        />

        {/* Editable Admin Assignment */}
        <Autocomplete
          options={admins}
          getOptionLabel={(option: Admin) => option.name}
          value={admins.find(admin => admin.id === assignedAdmin) || null}
          onChange={(e, newValue) => setAssignedAdmin(newValue?.id || null)}
          renderInput={(params) => <TextField {...params} label="Assign Admin" variant="outlined" disabled={!isEditable} />}
        />

        {/* Edit and Save Button */}
        <Tooltip title={isEditable ? "Save Changes" : "Edit"}>
          <IconButton
            onClick={() => isEditable ? handleSaveClick(project.service_id, notes, assignedAdmin) : handleEditClick(project.service_id)}
            sx={{ position: 'absolute', top: '10px', right: '10px', color: isEditable ? 'blue' : 'gray' }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Card>
    );
  };

  const DroppableColumn: React.FC<{ status: string, children: React.ReactNode }> = ({ status, children }) => {
    const [, drop] = useDrop({
      accept: 'CARD',
      drop: (item: { service_id: string }) => handleDrop(item.service_id, status),
    });

    return (
      <Grid item sx={{ minWidth: '280px', maxWidth: '400px' }}>
        <Paper ref={drop} sx={{ p: 2, border: `3px solid ${headerStyles[status]}`, height: '100%' }}>
          <Typography variant="h6" sx={{ color: headerStyles[status], mb: 2 }}>{status}</Typography>
          {children}
        </Paper>
      </Grid>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ width: '1200px', height: '700px', overflow: 'auto', p: 2 }}>
        {/* Add Icon for Backlog */}
        <IconButton onClick={() => setShowBacklog(!showBacklog)}>
          {showBacklog ? <CloseIcon /> : <AddIcon />}
        </IconButton>

        {/* Backlog Column */}
        {showBacklog && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Backlog</Typography>
            <Grid container spacing={2}>
              {columns['Backlog']?.map((project) => (
                <Grid item key={project.service_id} xs={12}>
                  <DraggableCard project={project} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Main Board */}
        <Grid container spacing={10}>
          {['Ready', 'InProgress', 'Review', 'Done'].map((status) => (
            <DroppableColumn key={status} status={status}>
              <Grid container spacing={2}>
                {columns[status]?.map((project) => (
                  <Grid item key={project.service_id} xs={12}>
                    <DraggableCard project={project} />
                  </Grid>
                ))}
              </Grid>
            </DroppableColumn>
          ))}
        </Grid>
      </Box>
    </DndProvider>
  );
};

export default AdminSchedule;
