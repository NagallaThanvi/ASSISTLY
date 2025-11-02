import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper,
  Alert
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';

export default function CreateCommunityPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        // Check if user has admin role
        const adminRoles = ['super_admin', 'community_admin'];
        const hasAdminRole = adminRoles.includes(userData?.role);
        
        setIsAdmin(hasAdminRole);
        
        if (!hasAdminRole) {
          setError('Access denied. Only administrators can create communities.');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Error verifying permissions.');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAdminStatus();
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Create community document
      const communityRef = await addDoc(collection(db, 'communities'), {
        name,
        description,
        admin: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      // Update user document to add this community with admin role
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        communities: {
          [communityRef.id]: 'admin'
        }
      }, { merge: true });

      navigate(`/community/${communityRef.id}`);
    } catch (error) {
      console.error('Error creating community:', error);
      setError('Failed to create community. Please try again.');
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Verifying permissions...</Typography>
        </Paper>
      </Container>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body2">
              Only administrators can create new communities. Please contact a super admin if you need to create a community.
            </Typography>
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/communities')}
            sx={{ mt: 2 }}
          >
            Back to Communities
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PeopleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="700">
            Create New Community
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            🔒 <strong>Admin Only:</strong> You have permission to create communities. As the creator, you'll be the community admin.
          </Typography>
        </Alert>

        <Typography variant="body1" color="text.secondary" mb={4}>
          Start a new community and invite members to join. You'll manage member requests and moderate the community.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Community Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 3 }}
            placeholder="e.g., Downtown Neighbors, Tech Enthusiasts"
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            sx={{ mb: 4 }}
            placeholder="Describe your community and its purpose..."
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !name.trim() || !isAdmin}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                px: 4,
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
              {loading ? 'Creating...' : 'Create Community'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/communities')}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
