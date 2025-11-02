import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS } from '../../utils/constants';
import { useApp } from '../../context/AppContext';

const AdminSettings = ({ communityId }) => {
  const { showNotification } = useApp();
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    location: '',
    active: true,
    autoApproveRequests: false,
    requireVerification: true,
    maxRequestsPerUser: 10
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [communityId]);

  const loadSettings = async () => {
    try {
      const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId);
      const communityDoc = await getDoc(communityRef);
      if (communityDoc.exists()) {
        setSettings({ ...settings, ...communityDoc.data() });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId);
      await updateDoc(communityRef, {
        name: settings.name,
        description: settings.description,
        location: settings.location,
        active: settings.active,
        autoApproveRequests: settings.autoApproveRequests,
        requireVerification: settings.requireVerification,
        maxRequestsPerUser: settings.maxRequestsPerUser,
        updatedAt: new Date()
      });
      showNotification('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Community Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          Save Changes
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Community Name"
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Description"
            value={settings.description}
            onChange={(e) => setSettings({ ...settings, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Location"
            value={settings.location}
            onChange={(e) => setSettings({ ...settings, location: e.target.value })}
            fullWidth
          />

          <Typography variant="h6" sx={{ mt: 2 }}>
            Community Settings
          </Typography>
          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={settings.active}
                onChange={(e) => setSettings({ ...settings, active: e.target.checked })}
              />
            }
            label="Community Active"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.requireVerification}
                onChange={(e) => setSettings({ ...settings, requireVerification: e.target.checked })}
              />
            }
            label="Require Request Verification"
          />

          <TextField
            label="Max Requests Per User"
            type="number"
            value={settings.maxRequestsPerUser}
            onChange={(e) => setSettings({ ...settings, maxRequestsPerUser: parseInt(e.target.value) })}
            fullWidth
            helperText="Maximum number of open requests a user can have at once"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminSettings;
