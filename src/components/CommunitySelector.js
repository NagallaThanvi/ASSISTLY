import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  LocationCity as CityIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { getAllCommunities } from '../utils/communityUtils';
import { createJoinRequest, getUserJoinRequest } from '../utils/joinRequestUtils';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const CommunitySelector = ({ open, userId, userName, userEmail, onComplete }) => {
  const { showNotification } = useApp();
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [existingRequest, setExistingRequest] = useState(null);
  const [verificationData, setVerificationData] = useState({
    address: '',
    zipCode: '',
    residencyProof: 'utility_bill'
  });

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const communitiesList = await getAllCommunities();
      
      // If no communities exist, show error
      if (communitiesList.length === 0) {
        setError('No communities available. Please contact administrator.');
      } else {
        setCommunities(communitiesList);
      }
    } catch (err) {
      console.error('Error loading communities:', err);
      setError('Failed to load communities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCommunity = (community) => {
    setSelectedCommunity(community);
  };

  const handleSubmit = async () => {
    if (!selectedCommunity) {
      showNotification('Please select a community', 'warning');
      return;
    }

    // Validate verification data
    if (!verificationData.address.trim()) {
      showNotification('Please provide your address', 'warning');
      return;
    }

    if (!verificationData.zipCode.trim()) {
      showNotification('Please provide your ZIP/Postal code', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // Check if user already has a pending request
      const existing = await getUserJoinRequest(userId, selectedCommunity.id);
      
      if (existing) {
        if (existing.status === 'pending') {
          showNotification('You already have a pending request for this community', 'info');
          setExistingRequest(existing);
          setSubmitting(false);
          return;
        } else if (existing.status === 'rejected') {
          showNotification('Your previous request was rejected. Please contact an admin.', 'warning');
          setSubmitting(false);
          return;
        }
      }

      // Create join request with verification data
      await createJoinRequest(
        userId,
        selectedCommunity.id,
        userEmail,
        userName,
        message,
        verificationData
      );
      
      showNotification(
        `Join request sent to ${selectedCommunity.name}! Please wait for admin approval.`,
        'success'
      );
      
      onComplete({ pending: true, community: selectedCommunity });
    } catch (err) {
      console.error('Error creating join request:', err);
      showNotification('Failed to send join request. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CityIcon color="primary" />
          <Typography variant="h5" component="span" fontWeight="600">
            Select Your Community
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Choose the community you want to join. Your request will be reviewed by a community admin.
        </Alert>

        {existingRequest && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Pending Request:</strong> You have already requested to join this community. 
              Please wait for admin approval.
            </Typography>
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {communities.map((community) => (
              <Card
                key={community.id}
                sx={{
                  border: selectedCommunity?.id === community.id ? 2 : 1,
                  borderColor: selectedCommunity?.id === community.id ? 'primary.main' : 'divider',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardActionArea onClick={() => handleSelectCommunity(community)}>
                  <CardContent>
                    {selectedCommunity?.id === community.id && (
                      <CheckIcon
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontSize: 28
                        }}
                      />
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CityIcon color="primary" />
                      <Typography variant="h6" fontWeight="600">
                        {community.name}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {community.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {community.location && (
                        <Chip
                          label={community.location}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {community.memberCount !== undefined && (
                        <Chip
                          icon={<PeopleIcon />}
                          label={`${community.memberCount} members`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}

        {selectedCommunity && !existingRequest && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Verification Required
              </Typography>
              <Typography variant="caption">
                To ensure you're a genuine member of this community, please provide your local address.
                This information will be verified by the admin.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              required
              label="Your Address"
              placeholder="123 Main Street, Apartment 4B"
              value={verificationData.address}
              onChange={(e) => setVerificationData(prev => ({ ...prev, address: e.target.value }))}
              sx={{ mb: 2 }}
              helperText="Your complete residential address in this community"
            />

            <TextField
              fullWidth
              required
              label="ZIP/Postal Code"
              placeholder="12345"
              value={verificationData.zipCode}
              onChange={(e) => setVerificationData(prev => ({ ...prev, zipCode: e.target.value }))}
              sx={{ mb: 2 }}
              helperText="This helps verify you're in the community area"
            />

            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Proof of Residency (Admin may request)</FormLabel>
              <RadioGroup
                value={verificationData.residencyProof}
                onChange={(e) => setVerificationData(prev => ({ ...prev, residencyProof: e.target.value }))}
              >
                <FormControlLabel value="utility_bill" control={<Radio />} label="Utility Bill" />
                <FormControlLabel value="lease_agreement" control={<Radio />} label="Lease Agreement" />
                <FormControlLabel value="property_deed" control={<Radio />} label="Property Deed" />
                <FormControlLabel value="government_id" control={<Radio />} label="Government ID with Address" />
              </RadioGroup>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Message to Admin (Optional)"
              placeholder="Tell the admin why you want to join this community..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              helperText="This message will be sent to the community admin with your request"
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedCommunity || submitting || loading}
          sx={{ px: 4 }}
        >
          {submitting ? <CircularProgress size={24} /> : 'Request to Join'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommunitySelector;
