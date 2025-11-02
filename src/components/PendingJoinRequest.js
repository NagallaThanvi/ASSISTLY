import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Button,
  Chip
} from '@mui/material';
import {
  HourglassEmpty as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getUserJoinRequest, cancelJoinRequest } from '../utils/joinRequestUtils';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const PendingJoinRequest = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { showNotification } = useApp();
  const [joinRequest, setJoinRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadJoinRequest();
    // Poll every 10 seconds to check for updates
    const interval = setInterval(loadJoinRequest, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const loadJoinRequest = async () => {
    if (!user) return;

    try {
      // Check if user has a pending community in their profile
      const pendingCommunityId = userProfile?.pendingCommunity || userProfile?.communityId;
      
      if (!pendingCommunityId) {
        setLoading(false);
        return;
      }

      const request = await getUserJoinRequest(user.uid, pendingCommunityId);
      setJoinRequest(request);
      
      // If approved, refresh user profile
      if (request && request.status === 'approved') {
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Error loading join request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your join request?')) {
      return;
    }

    setCancelling(true);
    try {
      await cancelJoinRequest(joinRequest.id, user.uid);
      showNotification('Join request cancelled', 'info');
      setJoinRequest(null);
    } catch (error) {
      console.error('Error cancelling request:', error);
      showNotification('Error cancelling request', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!joinRequest) {
    return null;
  }

  const getStatusInfo = () => {
    switch (joinRequest.status) {
      case 'pending':
        return {
          icon: <PendingIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          color: 'warning',
          title: 'Join Request Pending',
          message: 'Your request to join the community is being reviewed by an admin. You will be notified once it is approved.'
        };
      case 'rejected':
        return {
          icon: <RejectedIcon sx={{ fontSize: 60, color: 'error.main' }} />,
          color: 'error',
          title: 'Join Request Rejected',
          message: joinRequest.rejectionReason || 'Your request to join the community was rejected.'
        };
      case 'approved':
        return {
          icon: <ApprovedIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          color: 'success',
          title: 'Welcome to the Community!',
          message: 'Your request has been approved. Refreshing...'
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          {statusInfo.icon}
        </Box>

        <Typography variant="h4" gutterBottom fontWeight="bold">
          {statusInfo.title}
        </Typography>

        <Alert severity={statusInfo.color} sx={{ mt: 3, mb: 3 }}>
          <Typography variant="body1">
            {statusInfo.message}
          </Typography>
        </Alert>

        {joinRequest.message && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'left' }}>
            <Typography variant="caption" color="text.secondary">
              Your Message to Admin:
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {joinRequest.message}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadJoinRequest}
          >
            Refresh Status
          </Button>

          {joinRequest.status === 'pending' && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          )}
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> This page will automatically refresh when your request is processed.
            You can also manually refresh using the button above.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PendingJoinRequest;
