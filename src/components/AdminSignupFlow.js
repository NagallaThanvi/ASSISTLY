import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  AdminPanelSettings as AdminIcon,
  People as CommunityIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { auth, db } from '../firebase';
import { useApp } from '../context/AppContext';
import { COLLECTIONS } from '../utils/constants';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const AdminSignupFlow = () => {
  const navigate = useNavigate();
  const { showNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Step 1: Admin Account
  const [adminData, setAdminData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  
  // Step 2: Community Details
  const [communityData, setCommunityData] = useState({
    name: '',
    description: '',
    location: ''
  });
  
  const [errors, setErrors] = useState({});
  const googleProvider = new GoogleAuthProvider();

  const steps = ['Create Admin Account', 'Setup Community', 'Complete'];

  const validateAdminData = () => {
    const newErrors = {};

    if (!adminData.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    }

    if (!adminData.email) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(adminData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!adminData.password) {
      newErrors.password = 'Password is required';
    } else if (adminData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (adminData.password !== adminData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCommunityData = () => {
    const newErrors = {};

    if (!communityData.name.trim()) {
      newErrors.name = 'Community name is required';
    }

    if (!communityData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createAdminAndCommunity = async (userId, email, displayName) => {
    try {
      // Create community first
      const communityRef = doc(collection(db, COLLECTIONS.COMMUNITIES));
      const communityId = communityRef.id;
      
      await setDoc(communityRef, {
        name: communityData.name,
        description: communityData.description,
        location: communityData.location || '',
        adminId: userId,
        adminEmail: email,
        adminName: displayName,
        memberCount: 1,
        active: true,
        isPrivate: true, // Communities are private by default
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create admin profile with community reference
      await setDoc(doc(db, COLLECTIONS.USERS, userId), {
        uid: userId,
        email: email,
        displayName: displayName,
        role: 'community_admin',
        userType: 'both',
        onboardingCompleted: true,
        communityId: communityId, // Primary community
        communities: {
          [communityId]: 'admin' // Can manage multiple communities
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        joinedAt: serverTimestamp()
      });

      return communityId;
    } catch (error) {
      console.error('Error creating admin and community:', error);
      throw error;
    }
  };

  const handleAdminNext = () => {
    if (validateAdminData()) {
      setActiveStep(1);
    }
  };

  const handleCommunityBack = () => {
    setActiveStep(0);
  };

  const handleGoogleSignup = async () => {
    if (!validateCommunityData()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Create admin profile and community
      const communityId = await createAdminAndCommunity(
        result.user.uid,
        result.user.email,
        result.user.displayName || 'Admin User'
      );

      setActiveStep(2);
      showNotification('🎉 Admin account and community created successfully!', 'success');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/community/${communityId}`);
      }, 2000);
    } catch (error) {
      console.error('Google signup error:', error);
      setErrors({ general: 'Failed to create admin account with Google' });
      showNotification('Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!validateCommunityData()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        adminData.email,
        adminData.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: adminData.displayName
      });

      // Create admin profile and community
      const communityId = await createAdminAndCommunity(
        userCredential.user.uid,
        adminData.email,
        adminData.displayName
      );

      setActiveStep(2);
      showNotification('🎉 Admin account and community created successfully!', 'success');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/community/${communityId}`);
      }, 2000);
    } catch (error) {
      console.error('Signup error:', error);

      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'This email is already registered'
        : error.code === 'auth/weak-password'
        ? 'Password is too weak'
        : 'An error occurred during signup. Please try again.';

      setErrors({ general: errorMessage });
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e, type) => {
    const { name, value } = e.target;
    if (type === 'admin') {
      setAdminData(prev => ({ ...prev, [name]: value }));
    } else {
      setCommunityData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            border: '2px solid',
            borderColor: 'primary.main'
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
                }}
              >
                {activeStep === 0 && <AdminIcon sx={{ fontSize: 40, color: 'white' }} />}
                {activeStep === 1 && <CommunityIcon sx={{ fontSize: 40, color: 'white' }} />}
                {activeStep === 2 && <CheckIcon sx={{ fontSize: 40, color: 'white' }} />}
              </Box>
            </Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Create Your Community Platform
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set up your admin account and create your first community
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Error Alert */}
          {errors.general && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.general}
            </Alert>
          )}

          {/* Step 1: Admin Account */}
          {activeStep === 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Step 1:</strong> Create your administrator account to manage your community
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="displayName"
                  value={adminData.displayName}
                  onChange={(e) => handleChange(e, 'admin')}
                  error={!!errors.displayName}
                  helperText={errors.displayName}
                  disabled={loading}
                  required
                />

                <TextField
                  fullWidth
                  label="Admin Email"
                  name="email"
                  type="email"
                  value={adminData.email}
                  onChange={(e) => handleChange(e, 'admin')}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={loading}
                  required
                  autoComplete="email"
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={adminData.password}
                  onChange={(e) => handleChange(e, 'admin')}
                  error={!!errors.password}
                  helperText={errors.password || 'Must be at least 6 characters'}
                  disabled={loading}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={adminData.confirmPassword}
                  onChange={(e) => handleChange(e, 'admin')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  disabled={loading}
                  required
                />

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAdminNext}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    }
                  }}
                >
                  Next: Setup Community
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Community Setup */}
          {activeStep === 1 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Step 2:</strong> Create your private community space
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Community Name"
                  name="name"
                  value={communityData.name}
                  onChange={(e) => handleChange(e, 'community')}
                  error={!!errors.name}
                  helperText={errors.name || 'e.g., Downtown Neighbors, Tech Hub'}
                  disabled={loading}
                  required
                />

                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={4}
                  value={communityData.description}
                  onChange={(e) => handleChange(e, 'community')}
                  error={!!errors.description}
                  helperText={errors.description || 'Describe your community and its purpose'}
                  disabled={loading}
                  required
                />

                <TextField
                  fullWidth
                  label="Location (Optional)"
                  name="location"
                  value={communityData.location}
                  onChange={(e) => handleChange(e, 'community')}
                  helperText="e.g., Downtown Seattle, Virtual"
                  disabled={loading}
                />

                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    🔒 <strong>Privacy:</strong> Your community will be private. Only approved members can see and participate in activities.
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCommunityBack}
                    disabled={loading}
                  >
                    Back
                  </Button>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleEmailSignup}
                    disabled={loading}
                    sx={{
                      flex: 1,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Create Admin & Community'}
                  </Button>
                </Box>

                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  Complete with Google
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 3: Success */}
          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                🎉 Success!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your admin account and community have been created successfully.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting to your community dashboard...
              </Typography>
              <CircularProgress sx={{ mt: 3 }} />
            </Box>
          )}

          {/* Footer */}
          {activeStep < 2 && (
            <>
              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>What you'll get:</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>Your own private community space</li>
                    <li>Full admin control over members and content</li>
                    <li>Approve/reject join requests</li>
                    <li>Members can only see activities within your community</li>
                  </ul>
                </Typography>
              </Box>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Button
                    variant="text"
                    onClick={() => navigate('/admin-login')}
                    sx={{ fontWeight: 600, textTransform: 'none' }}
                  >
                    Admin Login
                  </Button>
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminSignupFlow;
