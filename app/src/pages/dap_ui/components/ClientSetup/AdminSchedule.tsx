import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Typography, TextField, Button, Autocomplete
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'; // Changed import
import AuthService from '../../../../services/auth.service';

type ServiceProject = {
  service_id: string;
  client_id: string;
  service_type: string;
  form_type: string;
  institution_name: string;
  documents_required: any;
  notes: string;
  hours_worked: number;
  status: string;
  assigned_admin_id: string | null;
};

type Admin = {
  user_id: string;
  name: string;
};

const useStyles = makeStyles({
  boardContainer: {
    display: 'flex',
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '16px',
    backgroundColor: '#F5F5F5',
  },
  column: {
    minWidth: '300px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    marginRight: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  columnHeader: {
    padding: '16px',
    borderBottom: '1px solid #E0E0E0',
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#424242',
  },
  card: {
    margin: '8px 16px',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    cursor: 'pointer',
    position: 'relative',
    '&:hover': {
      boxShadow: '0 4px 6px rgba(0,0,0,0.16)',
    },
  },
  cardContent: {
    marginBottom: '8px',
  },
});

const AdminSchedule: React.FC = () => {
  const classes = useStyles();
  const [columns, setColumns] = useState<{ [key: string]: ServiceProject[] }>({
    Backlog: [],
    Ready: [],
    InProgress: [],
    Review: [],
    Done: [],
  });
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [editableCardId, setEditableCardId] = useState<string | null>(null);

  const fetchServiceProjects = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8080/api/get_service_projects', {
        headers: {
          'x-access-token': AuthService.getCurrentUser()?.accessToken,
        },
      });
      if (response.data.service_projects) {
        const projects = response.data.service_projects;
        console.log(projects);
        const newColumns: { [key: string]: ServiceProject[] } = {
          Backlog: [],
          Ready: [],
          InProgress: [],
          Review: [],
          Done: [],
        };

        const knownStatuses = ['Backlog', 'Ready', 'InProgress', 'Review', 'Done']; // Known statuses

        projects.forEach((project: ServiceProject) => {
          const statusKey = project.status || 'Backlog'; // Default to 'Backlog' if no status
          if (knownStatuses.includes(statusKey)) {
            newColumns[statusKey].push(project);
          } else {
            console.warn(`Unknown status: ${project.status}`);
          }
        });


        setColumns(newColumns);
      }
    } catch (error) {
      console.error('Error fetching service projects:', error);
    }
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8080/api/get_admins', {
        headers: {
          'x-access-token': AuthService.getCurrentUser()?.accessToken,
        },
      });
  
      const admins = response?.data?.admins || [];
      console.log('Admin response:', admins); // Log to verify the structure
  
      // Map the response to ensure that `user_id` is used correctly
      const mappedAdmins = admins.map((admin: { user_id: string }) => ({
        user_id: admin.user_id, // Keep user_id as is
      }));
  
      setAdmins(mappedAdmins); // Set mapped admins to state
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
      setColumns((prevColumns) => {
        const newColumns = { ...prevColumns };
        for (const status in newColumns) {
          newColumns[status] = newColumns[status].map((project) =>
            project.service_id === service_id ? { ...project, ...updates } : project
          );
        }
        return newColumns;
      });

      // Ensure service_id is included in the payload
      const payload = { service_id, ...updates };

      await axios.post(
        'http://127.0.0.1:8080/api/update_service_project',
        payload,
        { headers: { 'x-access-token': AuthService.getCurrentUser()?.accessToken } }
      );

    } catch (error) {
      console.error('Error updating service project:', error);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;

    const sourceItems = Array.from(columns[sourceColumnId]);
    const destItems = Array.from(columns[destColumnId]);

    const [movedItem] = sourceItems.splice(source.index, 1);
    movedItem.status = destColumnId;

    destItems.splice(destination.index, 0, movedItem);

    setColumns({
      ...columns,
      [sourceColumnId]: sourceItems,
      [destColumnId]: destItems,
    });

    updateServiceProject(movedItem.service_id, { status: destColumnId });
  };

  const parseDocuments = (documents: any): string => {
    const documentList: string[] = [];

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

    return documentList.join(', ');
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={classes.boardContainer}>
        {['Backlog', 'Ready', 'InProgress', 'Review', 'Done'].map((status) => (
          <Droppable droppableId={status} key={status}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={classes.column}
              >
                <div className={classes.columnHeader}>{status}</div>
                {columns[status]?.map((project, index) => (
                  <Draggable key={project.service_id} draggableId={project.service_id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <DraggableCard
                          project={project}
                          admins={admins}
                          editableCardId={editableCardId}
                          setEditableCardId={setEditableCardId}
                          updateServiceProject={updateServiceProject}
                          parseDocuments={parseDocuments}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

type DraggableCardProps = {
  project: ServiceProject;
  admins: Admin[];
  editableCardId: string | null;
  setEditableCardId: React.Dispatch<React.SetStateAction<string | null>>;
  updateServiceProject: (service_id: string, updates: any) => void;
  parseDocuments: (documents: any) => string;
};

const DraggableCard: React.FC<DraggableCardProps> = ({
  project,
  admins,
  editableCardId,
  setEditableCardId,
  updateServiceProject,
  parseDocuments,
}) => {
  const classes = useStyles();
  const [projectData, setProjectData] = useState<ServiceProject>(project);
  const isEditable = editableCardId === project.service_id;

  const handleFieldChange = (field: keyof ServiceProject, value: any) => {
    setProjectData({ ...projectData, [field]: value });
  };

  const handleBlur = async () => {
    setEditableCardId(null);
    await updateServiceProject(project.service_id, projectData);
  };

  const handleCardClick = () => {
    if (!isEditable) {
      setEditableCardId(project.service_id);
    }
  };

  const documentsList = parseDocuments(projectData.documents_required);

  return (
    <div className={classes.card} onClick={handleCardClick}>
      {isEditable ? (
        <>
          <TextField
            label="Service Type"
            value={projectData.service_type}
            onChange={(e) => handleFieldChange('service_type', e.target.value)}
            variant="standard"
            fullWidth
            className={classes.cardContent}
          />
          <TextField
            label="Form Types"
            value={documentsList}
            variant="standard"
            fullWidth
            className={classes.cardContent}
            disabled
          />
          <TextField
            label="Institution"
            value={projectData.institution_name}
            onChange={(e) => handleFieldChange('institution_name', e.target.value)}
            variant="standard"
            fullWidth
            className={classes.cardContent}
          />
          <TextField
            label="Notes"
            multiline
            maxRows={4}
            value={projectData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            variant="standard"
            fullWidth
            className={classes.cardContent}
          />
          <Autocomplete
            options={admins}
            getOptionLabel={(option: Admin) => option.user_id}
            value={admins.find((admin) => admin.user_id === projectData.assigned_admin_id) || null}
            onChange={(e, newValue) => handleFieldChange('assigned_admin_id', newValue?.user_id || null)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign Admin"
                variant="standard"
                className={classes.cardContent}
              />
            )}
          />
          <Button variant="contained" color="primary" onClick={handleBlur}>
            Save
          </Button>
        </>
      ) : (
        <>
          <Typography className={classes.cardContent}>
            <strong>Service Type:</strong> {projectData.service_type}
          </Typography>
          <Typography className={classes.cardContent}>
            <strong>Form Types:</strong> {documentsList}
          </Typography>
          <Typography className={classes.cardContent}>
            <strong>Institution:</strong> {projectData.institution_name}
          </Typography>
          <Typography className={classes.cardContent}>
            <strong>Notes:</strong> {projectData.notes}
          </Typography>
          {projectData.assigned_admin_id && (
            <Typography className={classes.cardContent}>
              <strong>Assigned Admin:</strong>{' '}
              {admins.find((admin) => admin.user_id === projectData.assigned_admin_id)?.user_id || ''}
            </Typography>
          )}
        </>
      )}
    </div>
  );
};

export default AdminSchedule;