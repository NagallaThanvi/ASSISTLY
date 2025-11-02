import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationCity as CityIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS } from '../../utils/constants';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const AdminCommunityCreator = () => {
  const { showNotification } = useApp();
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    active: true
  });

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const communitiesRef = collection(db, COLLECTIONS.COMMUNITIES);
      const snapshot = await getDocs(communitiesRef);
      const communitiesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCommunities(communitiesList);
    } catch (error) {
      console.error('Error loading communities:', error);
      showNotification('Error loading communities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (community = null) => {
    if (community) {
      setEditingCommunity(community);
      setFormData({
        name: community.name,
        description: community.description,
        location: community.location,
        active: community.active
      });
    } else {
      setEditingCommunity(null);
      setFormData({
        name: '',
        description: '',
        location: '',
        active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCommunity(null);
    setFormData({
      name: '',
      description: '',
      location: '',
      active: true
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showNotification('Community name is required', 'warning');
      return;
    }

    try {
      if (editingCommunity) {
        // Update existing community
        const communityRef = doc(db, COLLECTIONS.COMMUNITIES, editingCommunity.id);
        await updateDoc(communityRef, {
          name: formData.name,
          description: formData.description,
          location: formData.location,
          active: formData.active,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid
        });
        showNotification('Community updated successfully!', 'success');
      } else {
        // Create new community
        const communitiesRef = collection(db, COLLECTIONS.COMMUNITIES);
        const newCommunityRef = await addDoc(communitiesRef, {
          name: formData.name,
          description: formData.description,
          location: formData.location,
          active: formData.active,
          memberCount: 1,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          updatedAt: serverTimestamp()
        });
        
        // Auto-assign admin to this community if they don't have one
        const { userProfile } = await import('../../context/AuthContext');
        if (!userProfile?.communityId) {
          const userRef = doc(db, COLLECTIONS.USERS, user.uid);
          await updateDoc(userRef, {
            communityId: newCommunityRef.id,
            joinedCommunityAt: serverTimestamp()
          });
          showNotification('Community created and you have been assigned to it!', 'success');
          // Refresh page to update context
          window.location.reload();
        } else {
          showNotification('Community created successfully!', 'success');
        }
      }
      
      handleCloseDialog();
      loadCommunities();
    } catch (error) {
      console.error('Error saving community:', error);
      showNotification('Error saving community', 'error');
    }
  };

  const handleDelete = async (communityId, communityName) => {
    if (!window.confirm(`Are you sure you want to delete "${communityName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, COLLECTIONS.COMMUNITIES, communityId));
      showNotification('Community deleted successfully', 'success');
      loadCommunities();
    } catch (error) {
      console.error('Error deleting community:', error);
      showNotification('Error deleting community', 'error');
    }
  };

  const handleToggleActive = async (community) => {
    try {
      const communityRef = doc(db, COLLECTIONS.COMMUNITIES, community.id);
      await updateDoc(communityRef, {
        active: !community.active,
        updatedAt: serverTimestamp()
      });
      showNotification(
        `Community ${!community.active ? 'activated' : 'deactivated'}`,
        'success'
      );
      loadCommunities();
    } catch (error) {
      console.error('Error toggling community status:', error);
      showNotification('Error updating community status', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Manage Communities
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage communities for your platform
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadCommunities}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Community
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Total Communities:</strong> {communities.length} | 
          <strong> Active:</strong> {communities.filter(c => c.active).length} | 
          <strong> Inactive:</strong> {communities.filter(c => !c.active).length}
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {communities.map((community) => (
          <Grid item xs={12} md={6} lg={4} key={community.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CityIcon color="primary" />
                    <Typography variant="h6" fontWeight="600">
                      {community.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={community.active ? 'Active' : 'Inactive'}
                    color={community.active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {community.description || 'No description'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {community.location && (
                    <Chip
                      label={community.location}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  <Chip
                    icon={<PeopleIcon />}
                    label={`${community.memberCount || 0} members`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Created: {community.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(community)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(community.id, community.name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Button
                  size="small"
                  onClick={() => handleToggleActive(community)}
                >
                  {community.active ? 'Deactivate' : 'Activate'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {communities.length === 0 && !loading && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CityIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Communities Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create your first community to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Create Community
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCommunity ? 'Edit Community' : 'Create New Community'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Community Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Downtown Community"
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Brief description of the community"
            />

            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
              placeholder="e.g., Downtown, Suburbs, etc."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              }
              label="Active (users can join this community)"
            />

            <Alert severity="info">
              <Typography variant="body2">
                {editingCommunity 
                  ? 'Changes will be saved immediately'
                  : 'New community will be available for users to request joining'
                }
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCommunity ? 'Save Changes' : 'Create Community'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCommunityCreator;
