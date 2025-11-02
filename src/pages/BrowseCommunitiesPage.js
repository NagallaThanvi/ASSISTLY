import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { 
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';

export default function BrowseCommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState({});
  const [userJoinRequests, setUserJoinRequests] = useState({});
  const [hasCheckedAdmin, setHasCheckedAdmin] = useState(false);
  const { user, userProfile, loading: authLoading } = useAuth();
  const { showNotification } = useApp();
  const navigate = useNavigate();

  // Redirect admins - they cannot browse/join other communities
  useEffect(() => {
    // Only check once when userProfile is loaded
    if (!hasCheckedAdmin && userProfile) {
      if (userProfile.role === 'community_admin' || userProfile.role === 'super_admin') {
        showNotification('Admins cannot browse or join other communities', 'info');
        navigate('/communities', { replace: true });
      }
      setHasCheckedAdmin(true);
    }
  }, [userProfile, navigate, showNotification, hasCheckedAdmin]);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      console.log('Fetching communities...');
      
      // Fetch all communities
      const communitiesSnap = await getDocs(collection(db, 'communities'));
      console.log('Communities fetched:', communitiesSnap.size);
      
      const allCommunities = communitiesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch user's join requests (with error handling)
      if (user) {
        try {
          console.log('Fetching join requests for user:', user.uid);
          const joinRequestsQuery = query(
            collection(db, 'join_requests'),
            where('userId', '==', user.uid)
          );
          const joinRequestsSnap = await getDocs(joinRequestsQuery);
          console.log('Join requests fetched:', joinRequestsSnap.size);
          
          const requests = {};
          joinRequestsSnap.docs.forEach(doc => {
            const data = doc.data();
            requests[data.communityId] = data.status;
          });
          setUserJoinRequests(requests);
        } catch (joinError) {
          console.warn('Could not fetch join requests:', joinError);
          // Continue anyway - not critical
        }
      }

      setCommunities(allCommunities);
      console.log('Communities set successfully:', allCommunities.length);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching communities:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      showNotification(`Failed to load communities: ${error.message}`, 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when auth is loaded and user exists
    if (!authLoading && user) {
      fetchCommunities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleRequestJoin = async (communityId, communityName) => {
    // Check authentication
    if (!user) {
      showNotification('Please login to join a community', 'warning');
      navigate('/login', { replace: true });
      return;
    }

    // Wait for userProfile to load
    if (!userProfile) {
      showNotification('Loading your profile...', 'info');
      return;
    }

    setRequestLoading(prev => ({ ...prev, [communityId]: true }));

    try {
      // Check if user already has a community
      if (userProfile.communityId) {
        showNotification('You are already part of a community', 'info');
        setRequestLoading(prev => ({ ...prev, [communityId]: false }));
        return;
      }

      // Create join request
      await addDoc(collection(db, 'join_requests'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || userProfile.displayName || user.email,
        communityId: communityId,
        communityName: communityName,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      showNotification('Join request sent! Wait for admin approval.', 'success');
      
      // Update local state
      setUserJoinRequests(prev => ({ ...prev, [communityId]: 'pending' }));
      setRequestLoading(prev => ({ ...prev, [communityId]: false }));
    } catch (error) {
      console.error('Error requesting to join:', error);
      showNotification('Failed to send join request. Please try again.', 'error');
      setRequestLoading(prev => ({ ...prev, [communityId]: false }));
    }
  };

  const getButtonState = (communityId) => {
    // User is already member
    if (userProfile?.communityId === communityId) {
      return { text: 'Already Member', disabled: true, color: 'success', icon: <CheckCircleIcon /> };
    }
    
    // User has pending request
    if (userJoinRequests[communityId] === 'pending') {
      return { text: 'Request Pending', disabled: true, color: 'warning', icon: null };
    }
    
    // User can request to join
    return { text: 'Request to Join', disabled: false, color: 'primary', icon: <SendIcon /> };
  };

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please login to browse communities.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="700" gutterBottom>
            Browse Communities
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Discover and join communities near you
          </Typography>
        </Box>
        <IconButton 
          onClick={fetchCommunities}
          color="primary"
          sx={{
            bgcolor: 'primary.lighter',
            '&:hover': { bgcolor: 'primary.light' }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {userProfile?.communityId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are already a member of a community. You can view it in "Your Communities".
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading communities...
          </Typography>
        </Box>
      ) : communities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No communities available
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Be the first to create a community!
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/admin-signup')}
          >
            Create Community
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {communities.map(community => {
            const buttonState = getButtonState(community.id);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={community.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                      {community.name}
                    </Typography>
                    
                    {community.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {community.location}
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {community.description || 'No description available'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        icon={<PeopleIcon />}
                        label={`${community.memberCount || 0} members`}
                        size="small"
                        variant="outlined"
                      />
                      {community.isPrivate && (
                        <Chip 
                          label="Private"
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      fullWidth
                      variant="contained"
                      color={buttonState.color}
                      startIcon={buttonState.icon}
                      disabled={buttonState.disabled || requestLoading[community.id]}
                      onClick={() => handleRequestJoin(community.id, community.name)}
                    >
                      {requestLoading[community.id] ? (
                        <CircularProgress size={20} />
                      ) : (
                        buttonState.text
                      )}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
