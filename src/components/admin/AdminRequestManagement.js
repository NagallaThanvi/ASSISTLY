import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Star as StarIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS } from '../../utils/constants';
import { useApp } from '../../context/AppContext';
import { logAdminAction } from '../../utils/adminUtils';
import { useAuth } from '../../context/AuthContext';

const AdminRequestManagement = ({ communityId }) => {
  const { user } = useAuth();
  const { showNotification } = useApp();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [communityId]);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, statusFilter, requests]);

  const loadRequests = async () => {
    try {
      const requestsQuery = query(
        collection(db, COLLECTIONS.REQUESTS),
        where('communityId', '==', communityId)
      );
      const snapshot = await getDocs(requestsQuery);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading requests:', error);
      showNotification('Error loading requests', 'error');
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleDeleteRequest = async () => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.REQUESTS, selectedRequest.id));
      await logAdminAction({
        action: 'REQUEST_DELETED',
        requestId: selectedRequest.id,
        performedBy: user.uid,
        communityId: communityId
      });
      showNotification('Request deleted successfully', 'success');
      setDeleteDialogOpen(false);
      loadRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      showNotification('Error deleting request', 'error');
    }
  };

  const handleFeatureRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.REQUESTS, requestId), {
        featured: true
      });
      await logAdminAction({
        action: 'REQUEST_FEATURED',
        requestId: requestId,
        performedBy: user.uid,
        communityId: communityId
      });
      showNotification('Request featured successfully', 'success');
      loadRequests();
    } catch (error) {
      console.error('Error featuring request:', error);
      showNotification('Error featuring request', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'primary',
      claimed: 'warning',
      completed: 'success',
      cancelled: 'error',
      pending_completion: 'info'
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Request Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ width: 150 }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="claimed">Claimed</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <TextField
            size="small"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ width: 300 }}
          />
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {filteredRequests.length} of {requests.length} requests
      </Typography>

      <Grid container spacing={2}>
        {filteredRequests.map((request) => (
          <Grid item xs={12} md={6} lg={4} key={request.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Chip
                    label={request.status}
                    color={getStatusColor(request.status)}
                    size="small"
                  />
                  {request.featured && (
                    <Chip icon={<StarIcon />} label="Featured" color="warning" size="small" />
                  )}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {request.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {request.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    By: {request.postedBy} | {request.category}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <IconButton size="small" color="primary">
                  <ViewIcon />
                </IconButton>
                {!request.featured && (
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => handleFeatureRequest(request.id)}
                  >
                    <StarIcon />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setSelectedRequest(request);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Request</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the request "{selectedRequest?.title}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteRequest} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminRequestManagement;
