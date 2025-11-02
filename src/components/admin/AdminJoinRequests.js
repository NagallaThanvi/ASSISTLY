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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Badge,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  getPendingJoinRequests,
  getAllJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  JOIN_REQUEST_STATUS
} from '../../utils/joinRequestUtils';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const AdminJoinRequests = ({ communityId }) => {
  const { user } = useAuth();
  const { showNotification } = useApp();
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [communityId, showAll]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsList = showAll 
        ? await getAllJoinRequests(communityId)
        : await getPendingJoinRequests(communityId);
      
      setRequests(requestsList);
      setPendingCount(requestsList.filter(r => r.status === JOIN_REQUEST_STATUS.PENDING).length);
    } catch (error) {
      console.error('Error loading join requests:', error);
      showNotification('Error loading join requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    try {
      await approveJoinRequest(request.id, user.uid);
      showNotification(`${request.userName} has been approved to join the community!`, 'success');
      loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      showNotification('Error approving request', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showNotification('Please provide a reason for rejection', 'warning');
      return;
    }

    try {
      await rejectJoinRequest(selectedRequest.id, user.uid, rejectionReason);
      showNotification(`Request from ${selectedRequest.userName} has been rejected`, 'info');
      setRejectDialogOpen(false);
      setRejectionReason('');
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      showNotification('Error rejecting request', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      [JOIN_REQUEST_STATUS.PENDING]: 'warning',
      [JOIN_REQUEST_STATUS.APPROVED]: 'success',
      [JOIN_REQUEST_STATUS.REJECTED]: 'error'
    };
    return colors[status] || 'default';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Join Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and approve users requesting to join your community
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={showAll ? 'outlined' : 'contained'}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Pending Only' : 'Show All Requests'}
          </Button>
          <IconButton onClick={loadRequests} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {pendingCount > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            You have <strong>{pendingCount}</strong> pending join request{pendingCount !== 1 ? 's' : ''} waiting for review.
          </Typography>
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    {showAll ? 'No join requests found' : 'No pending join requests'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>
                    <Typography fontWeight="600">{request.userName}</Typography>
                  </TableCell>
                  <TableCell>{request.userEmail}</TableCell>
                  <TableCell>
                    {request.message ? (
                      <Tooltip title={request.message}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {request.message}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedRequest(request);
                              setViewDetailsDialog(true);
                            }}
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No message
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      color={getStatusColor(request.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(request.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {request.status === JOIN_REQUEST_STATUS.PENDING && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleApprove(request)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<RejectIcon />}
                          onClick={() => {
                            setSelectedRequest(request);
                            setRejectDialogOpen(true);
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                    {request.status === JOIN_REQUEST_STATUS.APPROVED && (
                      <Chip label="Approved" color="success" size="small" />
                    )}
                    {request.status === JOIN_REQUEST_STATUS.REJECTED && (
                      <Chip label="Rejected" color="error" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Join Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are about to reject the join request from <strong>{selectedRequest?.userName}</strong>.
            Please provide a reason.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejecting this request..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error">
            Reject Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsDialog} onClose={() => setViewDetailsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">User Name</Typography>
                <Typography variant="body1">{selectedRequest.userName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedRequest.userEmail}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Message</Typography>
                <Typography variant="body1">{selectedRequest.message || 'No message provided'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Requested At</Typography>
                <Typography variant="body1">{formatDate(selectedRequest.createdAt)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedRequest.status}
                  color={getStatusColor(selectedRequest.status)}
                  size="small"
                />
              </Box>
              {selectedRequest.rejectionReason && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Rejection Reason</Typography>
                  <Typography variant="body1">{selectedRequest.rejectionReason}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminJoinRequests;
