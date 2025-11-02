import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { completeUserCleanup, deleteAllUsers, deleteAllJoinRequests } from '../../utils/cleanupUsers';
import { useApp } from '../../context/AppContext';

const AdminCleanup = () => {
  const { showNotification } = useApp();
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCleanup = async () => {
    if (confirmText !== 'DELETE ALL USERS') {
      showNotification('Please type the confirmation text correctly', 'error');
      return;
    }

    setLoading(true);
    try {
      const cleanupResult = await completeUserCleanup();
      setResult(cleanupResult);
      showNotification('Cleanup completed successfully!', 'success');
      setConfirmDialog(false);
      setConfirmText('');
    } catch (error) {
      console.error('Cleanup error:', error);
      showNotification('Error during cleanup: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Database Cleanup
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Dangerous operations - use with extreme caution
      </Typography>

      <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold">
          ⚠️ DANGER ZONE - IRREVERSIBLE ACTIONS
        </Typography>
        <Typography variant="body2">
          These operations will permanently delete data and cannot be undone!
        </Typography>
      </Alert>

      {result && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Cleanup Results:</strong>
          </Typography>
          <Typography variant="body2">
            • Users deleted: {result.usersDeleted}
          </Typography>
          <Typography variant="body2">
            • Join requests deleted: {result.requestsDeleted}
          </Typography>
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Remove All Registered Users
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This will delete:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="• All user documents from Firestore" 
              secondary="User profiles, settings, and data"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="• All join requests" 
              secondary="Pending, approved, and rejected requests"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="• Reset community member counts" 
              secondary="Set all member counts back to 0"
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 2 }} />

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> This only deletes Firestore data. You must also delete 
            Firebase Authentication users manually from the Firebase Console.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmDialog(true)}
            disabled={loading}
          >
            Delete All Users
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manual Steps Required
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          After running the cleanup, you must also:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="1. Delete Firebase Authentication Users"
              secondary="Go to Firebase Console → Authentication → Users → Select All → Delete"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="2. Clear Browser Cache"
              secondary="Clear cookies and local storage to remove any cached data"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="3. Verify Cleanup"
              secondary="Check Firestore and Authentication to ensure all data is removed"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => !loading && setConfirmDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" />
            <Typography variant="h6">Confirm Deletion</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              THIS ACTION CANNOT BE UNDONE!
            </Typography>
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are about to permanently delete all registered users and their data.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Type <strong>DELETE ALL USERS</strong> to confirm:
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE ALL USERS"
            disabled={loading}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCleanup} 
            color="error" 
            variant="contained"
            disabled={loading || confirmText !== 'DELETE ALL USERS'}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete All Users'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCleanup;
