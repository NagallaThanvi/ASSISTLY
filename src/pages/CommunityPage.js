import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { 
  AdminPanelSettings as AdminIcon,
  Add as AddIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  EmojiEvents as LeaderboardIcon,
  Assignment as RequestsIcon
} from '@mui/icons-material';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CommunityLeaderboard from '../components/CommunityLeaderboard';

export default function CommunityPage() {
  const { communityId } = useParams();
  const [community, setCommunity] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Request form state
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    category: 'General Help',
    urgency: 'medium',
    location: ''
  });

  const categories = ['General Help', 'Groceries & Shopping', 'Medical Assistance', 'Transportation', 'Housework & Cleaning', 'Pet Care', 'Childcare', 'Technology Help', 'Yard Work', 'Moving & Delivery', 'Companionship', 'Other'];

  useEffect(() => {
    const fetchCommunity = async () => {
      const communityRef = doc(db, 'communities', communityId);
      const docSnap = await getDoc(communityRef);
      if (docSnap.exists()) {
        setCommunity({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };

    fetchCommunity();
  }, [communityId]);

  useEffect(() => {
    if (!currentUser) return;

    const checkMembership = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const userCommunities = userData.communities || {};
        if (userCommunities[communityId]) {
          setIsMember(true);
          if (userCommunities[communityId] === 'admin') {
            setIsAdmin(true);
          }
        }
      }
    };

    checkMembership();
  }, [currentUser, communityId]);

  useEffect(() => {
    if (!isMember || !communityId) return;

    const q = query(
      collection(db, 'requests'),
      where('communityId', '==', communityId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(requestsData);
    });

    return () => unsubscribe();
  }, [isMember, communityId]);

  const handleJoinRequest = async () => {
    try {
      await addDoc(collection(db, 'membershipRequests'), {
        communityId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setJoinRequestSent(true);
    } catch (error) {
      console.error('Error sending join request:', error);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'requests'), {
        ...requestForm,
        communityId,
        createdByUid: currentUser.uid,
        createdBy: currentUser.email,
        createdByEmail: currentUser.email,
        status: 'open',
        createdAt: serverTimestamp()
      });
      setShowRequestModal(false);
      setRequestForm({
        title: '',
        description: '',
        category: 'General Help',
        urgency: 'medium',
        location: ''
      });
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!community) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">Community not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              {community.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {community.description || 'No description'}
            </Typography>
          </Box>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AdminIcon />}
              onClick={() => navigate(`/admin/${communityId}`)}
              sx={{ bgcolor: 'primary.main' }}
            >
              Manage
            </Button>
          )}
        </Box>
      </Paper>

      {!isMember ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Join this community
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Request to join and get access to community requests
          </Typography>
          {joinRequestSent ? (
            <Alert severity="success" sx={{ maxWidth: 400, mx: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckIcon />
                Join request sent! Waiting for admin approval.
              </Box>
            </Alert>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={handleJoinRequest}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                px: 4,
                py: 1.5
              }}
            >
              Request to Join
            </Button>
          )}
        </Paper>
      ) : (
        <>
          {/* Tabs for Requests and Leaderboard */}
          <Paper elevation={2} sx={{ mb: 3 }}>
            <Tabs 
              value={currentTab} 
              onChange={(e, newValue) => setCurrentTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab 
                icon={<RequestsIcon />} 
                label="Requests" 
                iconPosition="start"
                sx={{ fontWeight: 600 }}
              />
              <Tab 
                icon={<LeaderboardIcon />} 
                label="Leaderboard" 
                iconPosition="start"
                sx={{ fontWeight: 600 }}
              />
            </Tabs>
          </Paper>

          {/* Requests Tab */}
          {currentTab === 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="600">
                  Community Requests
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowRequestModal(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}
                >
                  New Request
                </Button>
              </Box>

          {requests.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No requests yet. Be the first to create one!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {requests.map(request => (
                <Grid item xs={12} md={6} key={request.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight="600">
                          {request.title}
                        </Typography>
                        <Chip 
                          label={request.status} 
                          size="small"
                          color={request.status === 'open' ? 'success' : 'default'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {request.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={request.category} size="small" variant="outlined" />
                        <Chip 
                          label={request.urgency} 
                          size="small" 
                          color={request.urgency === 'high' ? 'error' : request.urgency === 'medium' ? 'warning' : 'default'}
                        />
                        {request.location && (
                          <Chip label={request.location} size="small" variant="outlined" />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Leaderboard Tab */}
      {currentTab === 1 && (
        <CommunityLeaderboard />
      )}
    </>
  )}

      {/* Create Request Modal */}
      <Dialog open={showRequestModal} onClose={() => setShowRequestModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateRequest}>
          <DialogTitle>Create New Request</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              value={requestForm.title}
              onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
              required
              sx={{ mt: 2, mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={requestForm.description}
              onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
              multiline
              rows={4}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Category"
              value={requestForm.category}
              onChange={(e) => setRequestForm({ ...requestForm, category: e.target.value })}
              sx={{ mb: 2 }}
            >
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Urgency"
              value={requestForm.urgency}
              onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}
              sx={{ mb: 2 }}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Location (optional)"
              value={requestForm.location}
              onChange={(e) => setRequestForm({ ...requestForm, location: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}
