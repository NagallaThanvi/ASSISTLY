import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
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
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

export default function CommunityListPage() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const communityIds = Object.keys(userData.communities || {});

          if (communityIds.length === 0) {
            setCommunities([]);
            setLoading(false);
            return;
          }

          // Fetch each community document
          const promises = communityIds.map(communityId => 
            getDoc(doc(db, 'communities', communityId))
              .then(snap => ({ 
                id: snap.id, 
                ...snap.data(),
                role: userData.communities[communityId]
              }))
          );
          Promise.all(promises).then(communitiesData => {
            setCommunities(communitiesData);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      });
    }
  }, [currentUser]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="700">
          Your Communities
        </Typography>
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
            Create your first community or request to join an existing one
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-community')}
          >
            Create Community
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {communities.map(community => (
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6" fontWeight="600">
                      {community.name}
                    </Typography>
                    {community.role === 'admin' && (
                      <Chip 
                        icon={<AdminIcon />}
                        label="Admin" 
                        size="small" 
                        color="primary"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {community.description || 'No description'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/community/${community.id}`)}
                  >
                    View
                  </Button>
                  {community.role === 'admin' && (
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => navigate(`/admin/${community.id}`)}
                    >
                      Manage
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
