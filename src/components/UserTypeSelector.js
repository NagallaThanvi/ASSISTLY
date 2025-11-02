import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert
} from '@mui/material';
import {
  HelpOutline as HelpIcon,
  VolunteerActivism as VolunteerIcon,
  People as BothIcon
} from '@mui/icons-material';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import CommunitySelector from './CommunitySelector';

const UserTypeSelector = ({ open, onComplete }) => {
  const { user, refreshUserProfile } = useAuth();
  const [selectedType, setSelectedType] = useState('both');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);

  const userTypes = [
    {
      value: 'resident',
      title: 'I Need Help',
      description: 'I\'m looking for assistance from community volunteers',
      icon: <HelpIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      features: [
        'Post help requests',
        'Connect with volunteers',
        'Rate your experience',
        'Get community support'
      ]
    },
    {
      value: 'volunteer',
      title: 'I Want to Help',
      description: 'I want to volunteer and help others in my community',
      icon: <VolunteerIcon sx={{ fontSize: 60, color: 'success.main' }} />,
      features: [
        'Browse help requests',
        'Offer your skills',
        'Build your reputation',
        'Make a difference'
      ]
    },
    {
      value: 'both',
      title: 'Both',
      description: 'I want to both seek and offer help in the community',
      icon: <BothIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
      features: [
        'Full platform access',
        'Post and respond to requests',
        'Flexible participation',
        'Complete community experience'
      ]
    }
  ];

  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Please select how you want to participate');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
        bio: '',
        location: '',
        phoneNumber: '',
        website: '',
        skills: [],
        languages: [],
        userType: selectedType,
        availability: selectedType === 'resident' ? 'not-applicable' : 'available',
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        onboardingCompleted: false // Will be set to true after community selection
      });

      // Show community selector
      setShowCommunitySelector(true);
    } catch (err) {
      console.error('Error setting user type:', err);
      setError('Failed to save your selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommunitySelected = async (result) => {
    try {
      if (result.pending) {
        // User submitted a join request - mark onboarding as complete but no community yet
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          onboardingCompleted: true,
          pendingCommunity: result.community.id
        }, { merge: true });

        // Refresh user profile in context
        if (refreshUserProfile) {
          await refreshUserProfile();
        }

        onComplete(selectedType);
      } else {
        // Direct assignment (old flow - shouldn't happen with new system)
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          onboardingCompleted: true
        }, { merge: true });

        if (refreshUserProfile) {
          await refreshUserProfile();
        }

        onComplete(selectedType);
      }
    } catch (err) {
      console.error('Error completing onboarding:', err);
    }
  };

  return (
    <>
    <Dialog 
      open={open} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        <Typography variant="h5" align="center" fontWeight="bold">
          Welcome to Assistly! 🎉
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
          How would you like to participate in our community?
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {userTypes.map((type) => (
                <Card
                  key={type.value}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    border: 2,
                    borderColor: selectedType === type.value ? 'primary.main' : 'divider',
                    bgcolor: selectedType === type.value ? 'action.selected' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => setSelectedType(type.value)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <FormControlLabel
                        value={type.value}
                        control={<Radio />}
                        label=""
                        sx={{ m: 0 }}
                      />
                      
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          {type.icon}
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {type.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {type.description}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mt: 2, pl: 9 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            What you can do:
                          </Typography>
                          <Box component="ul" sx={{ m: 0, pl: 2 }}>
                            {type.features.map((feature, index) => (
                              <Typography component="li" variant="body2" key={index}>
                                {feature}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </RadioGroup>
        </FormControl>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Don't worry!</strong> You can always change this later in your profile settings.
          </Typography>
        </Alert>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="large"
          disabled={loading || !selectedType}
          fullWidth
        >
          {loading ? 'Setting up your account...' : 'Continue'}
        </Button>
      </DialogActions>
    </Dialog>
    
    {/* Community Selector - shown after user type selection */}
    {showCommunitySelector && (
      <CommunitySelector
        open={showCommunitySelector}
        userId={user.uid}
        userName={user.displayName || user.email?.split('@')[0] || 'User'}
        userEmail={user.email}
        onComplete={handleCommunitySelected}
      />
    )}
    </>
  );
};

export default UserTypeSelector;
