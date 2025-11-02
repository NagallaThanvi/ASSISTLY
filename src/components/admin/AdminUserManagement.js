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
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Menu,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  AdminPanelSettings as AdminIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS } from '../../utils/constants';
import { banUser, unbanUser, assignAdminRole, ADMIN_ROLES } from '../../utils/adminUtils';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const AdminUserManagement = ({ communityId }) => {
  const { user } = useAuth();
  const { showNotification } = useApp();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, [communityId]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('communityId', '==', communityId)
      );
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('Error loading users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(u =>
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      showNotification('Please provide a reason for banning', 'warning');
      return;
    }

    try {
      await banUser(selectedUser.id, banReason, null, user.uid);
      showNotification('User banned successfully', 'success');
      setBanDialogOpen(false);
      setBanReason('');
      loadUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      showNotification('Error banning user', 'error');
    }
  };

  const handleUnbanUser = async () => {
    try {
      await unbanUser(selectedUser.id, user.uid);
      showNotification('User unbanned successfully', 'success');
      handleMenuClose();
      loadUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      showNotification('Error unbanning user', 'error');
    }
  };

  const handleMakeModerator = async () => {
    try {
      await assignAdminRole(selectedUser.id, ADMIN_ROLES.MODERATOR, communityId);
      showNotification('User promoted to moderator', 'success');
      handleMenuClose();
      loadUsers();
    } catch (error) {
      console.error('Error promoting user:', error);
      showNotification('Error promoting user', 'error');
    }
  };

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'resident': return 'primary';
      case 'volunteer': return 'success';
      case 'both': return 'secondary';
      default: return 'default';
    }
  };

  const getRoleChip = (role) => {
    if (!role) return null;
    
    const roleLabels = {
      [ADMIN_ROLES.SUPER_ADMIN]: { label: 'Super Admin', color: 'error' },
      [ADMIN_ROLES.COMMUNITY_ADMIN]: { label: 'Admin', color: 'warning' },
      [ADMIN_ROLES.MODERATOR]: { label: 'Moderator', color: 'info' }
    };

    const roleInfo = roleLabels[role];
    if (!roleInfo) return null;

    return (
      <Chip
        icon={<AdminIcon />}
        label={roleInfo.label}
        color={roleInfo.color}
        size="small"
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          User Management
        </Typography>
        <TextField
          size="small"
          placeholder="Search users..."
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

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Total Users: <strong>{users.length}</strong> | 
          Active: <strong>{users.filter(u => !u.banned).length}</strong> | 
          Banned: <strong>{users.filter(u => u.banned).length}</strong>
        </Typography>
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={u.photoURL} alt={u.displayName}>
                        {u.displayName?.[0]?.toUpperCase()}
                      </Avatar>
                      <Typography>{u.displayName || 'Unknown'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.userType || 'N/A'}
                      color={getUserTypeColor(u.userType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{getRoleChip(u.role)}</TableCell>
                  <TableCell>
                    {u.banned ? (
                      <Chip label="Banned" color="error" size="small" />
                    ) : (
                      <Chip label="Active" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {u.joinedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, u)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          // View user details
        }}>
          <InfoIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        
        {selectedUser && !selectedUser.banned && (
          <MenuItem onClick={() => {
            handleMenuClose();
            setBanDialogOpen(true);
          }}>
            <BlockIcon sx={{ mr: 1 }} /> Ban User
          </MenuItem>
        )}
        
        {selectedUser && selectedUser.banned && (
          <MenuItem onClick={handleUnbanUser}>
            <UnblockIcon sx={{ mr: 1 }} /> Unban User
          </MenuItem>
        )}
        
        {selectedUser && !selectedUser.role && (
          <MenuItem onClick={handleMakeModerator}>
            <AdminIcon sx={{ mr: 1 }} /> Make Moderator
          </MenuItem>
        )}
      </Menu>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ban User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are about to ban <strong>{selectedUser?.displayName}</strong>. 
            Please provide a reason.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for ban"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Enter reason for banning this user..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBanUser} variant="contained" color="error">
            Ban User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUserManagement;
