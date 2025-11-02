import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  LinearProgress,
  Divider,
  Paper,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon
} from '@mui/icons-material';

export default function CommunityListPage() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommunitiesWithStats = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        
        if (!docSnap.exists()) {
          setLoading(false);
          return;
        }

        const userData = docSnap.data();
        const communityIds = Object.keys(userData.communities || {});

        if (communityIds.length === 0) {
          setCommunities([]);
          setLoading(false);
          return;
        }

        // Fetch each community document with stats
        const communitiesData = await Promise.all(
          communityIds.map(async (communityId) => {
            const communitySnap = await getDoc(doc(db, 'communities', communityId));
            const communityData = {
              id: communitySnap.id,
              ...communitySnap.data(),
              role: userData.communities[communityId]
            };

            // Fetch request statistics for admin communities
            if (userData.communities[communityId] === 'admin') {
              const requestsQuery = query(
                collection(db, 'requests'),
                where('communityId', '==', communityId)
              );
              const requestsSnap = await getDocs(requestsQuery);
              
              const requests = requestsSnap.docs.map(doc => doc.data());
              const totalRequests = requests.length;
              const completedRequests = requests.filter(r => r.status === 'completed').length;
              const pendingRequests = requests.filter(r => r.status === 'open').length;
              const activeRequests = requests.filter(r => r.status === 'claimed' || r.status === 'pending_completion').length;

              communityData.stats = {
                total: totalRequests,
                completed: completedRequests,
                pending: pendingRequests,
                active: activeRequests,
                completionRate: totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0
              };
            }

            return communityData;
          })
        );

        setCommunities(communitiesData);
        
        // Check if user is admin of any community
        const hasAdminRole = communitiesData.some(c => c.role === 'admin');
        setIsAdmin(hasAdminRole);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching communities:', error);
        setLoading(false);
      }
    };

    fetchCommunitiesWithStats();
  }, [currentUser]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Redirect admins to admin dashboard */}
      {isAdmin && communities.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            As a community admin, manage your community through the Admin Dashboard.
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/admin')}
            sx={{ mr: 2 }}
          >
            Go to Admin Dashboard
          </Button>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="700">
          {isAdmin ? 'My Community' : 'Your Communities'}
        </Typography>
        {/* Only show Create Community if user is not already an admin */}
        {!isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-community')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)'
              }
            }}
          >
            Create Community
          </Button>
        )}
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : communities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No communities yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Browse available communities and request to join
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/browse-communities')}
            sx={{ mr: 2 }}
          >
            Browse Communities
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-community')}
          >
            Create Community
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {communities.map(community => (
            <Grid item xs={12} md={community.role === 'admin' ? 12 : 6} key={community.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: community.role === 'admin' ? '2px solid' : 'none',
                  borderColor: community.role === 'admin' ? 'primary.main' : 'transparent',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" fontWeight="600">
                        {community.name}
                      </Typography>
                      {community.role === 'admin' && (
                        <Chip 
                          icon={<AdminIcon />}
                          label="Admin" 
                          size="small" 
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {community.description || 'No description'}
                  </Typography>

                  {/* Admin Statistics */}
                  {community.role === 'admin' && community.stats && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <HistoryIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="subtitle1" fontWeight="600">
                            Request History
                          </Typography>
                        </Box>
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.lighter' }}>
                              <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main', mb: 0.5 }} />
                              <Typography variant="h4" fontWeight="700" color="primary.main">
                                {community.stats.total}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Total Requests
                              </Typography>
                            </Paper>
                          </Grid>
                          
                          <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter' }}>
                              <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mb: 0.5 }} />
                              <Typography variant="h4" fontWeight="700" color="success.main">
                                {community.stats.completed}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Completed
                              </Typography>
                            </Paper>
                          </Grid>
                          
                          <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.lighter' }}>
                              <PendingIcon sx={{ fontSize: 32, color: 'warning.main', mb: 0.5 }} />
                              <Typography variant="h4" fontWeight="700" color="warning.main">
                                {community.stats.pending}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Pending
                              </Typography>
                            </Paper>
                          </Grid>
                          
                          <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.lighter' }}>
                              <Typography variant="h4" fontWeight="700" color="info.main">
                                {community.stats.active}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                In Progress
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>

                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Completion Rate
                            </Typography>
                            <Typography variant="body2" fontWeight="600" color="success.main">
                              {community.stats.completionRate}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={community.stats.completionRate} 
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>
                      </Box>
                    </>
                  )}
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    variant="outlined"
                    size="medium"
                    onClick={() => navigate(`/community/${community.id}`)}
                  >
                    View Community
                  </Button>
                  {community.role === 'admin' && (
                    <Button 
                      variant="contained"
                      size="medium"
                      color="primary"
                      onClick={() => navigate(`/admin/${community.id}`)}
                      sx={{ ml: 'auto' }}
                    >
                      Manage Dashboard
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
