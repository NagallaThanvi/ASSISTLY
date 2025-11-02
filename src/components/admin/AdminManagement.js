import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { getCommunityAdmins, assignAdminRole, removeAdminRole, ADMIN_ROLES } from '../../utils/adminUtils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS } from '../../utils/constants';
import { useApp } from '../../context/AppContext';

const AdminManagement = ({ communityId }) => {
  const { showNotification } = useApp();
  const [admins, setAdmins] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState(ADMIN_ROLES.MODERATOR);

  useEffect(() => {
    loadAdmins();
    loadUsers();
  }, [communityId]);

  const loadAdmins = async () => {
    try {
      const adminsList = await getCommunityAdmins(communityId);
      setAdmins(adminsList);
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('communityId', '==', communityId)
      );
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(u => !u.role); // Only users without roles
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedUser) {
      showNotification('Please select a user', 'warning');
      return;
    }

    try {
      await assignAdminRole(selectedUser, selectedRole, communityId);
      showNotification('Admin role assigned successfully', 'success');
      setDialogOpen(false);
      setSelectedUser('');
      loadAdmins();
      loadUsers();
    } catch (error) {
      console.error('Error assigning admin role:', error);
      showNotification('Error assigning admin role', 'error');
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this admin role?')) {
      return;
    }

    try {
      await removeAdminRole(userId);
      showNotification('Admin role removed successfully', 'success');
      loadAdmins();
      loadUsers();
    } catch (error) {
      console.error('Error removing admin role:', error);
      showNotification('Error removing admin role', 'error');
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      [ADMIN_ROLES.COMMUNITY_ADMIN]: 'Community Admin',
      [ADMIN_ROLES.MODERATOR]: 'Moderator',
      [ADMIN_ROLES.SUPER_ADMIN]: 'Super Admin'
    };
    return labels[role] || role;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Admin Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Admin
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Manage administrators and moderators for your community. Admins have full control, 
        while moderators have limited moderation permissions.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Assigned Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>{admin.displayName}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <Chip
                    icon={<AdminIcon />}
                    label={getRoleLabel(admin.role)}
                    color={admin.role === ADMIN_ROLES.COMMUNITY_ADMIN ? 'warning' : 'info'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {admin.roleAssignedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveAdmin(admin.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {admins.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    No admins assigned yet
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Admin Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Admin</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Select User"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              fullWidth
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.displayName} ({user.email})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              fullWidth
            >
              <MenuItem value={ADMIN_ROLES.MODERATOR}>Moderator (Limited permissions)</MenuItem>
              <MenuItem value={ADMIN_ROLES.COMMUNITY_ADMIN}>Community Admin (Full control)</MenuItem>
            </TextField>

            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Moderator:</strong> Can view users, moderate content, and view reports.<br />
                <strong>Community Admin:</strong> Full control over community settings, users, and content.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddAdmin} variant="contained">
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminManagement;
