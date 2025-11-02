import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  MenuItem
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  AdminPanelSettings as AdminIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { auth, db } from '../firebase';
import { useApp } from '../context/AppContext';
import { COLLECTIONS } from '../utils/constants';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const AdminSignup = () => {
  const navigate = useNavigate();
  const { showNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'community_admin'
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    general: ''
  });

  const googleProvider = new GoogleAuthProvider();

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      general: ''
    };

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const createAdminProfile = async (userId, email, displayName) => {
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, userId), {
        uid: userId,
        email: email,
        displayName: displayName,
        role: formData.role,
        userType: 'both',
        onboardingCompleted: true,
        communityId: null, // Admin can create/join communities later
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        joinedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating admin profile:', error);
      throw error;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setErrors(prev => ({ ...prev, general: '' }));

    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Create admin profile
      await createAdminProfile(
        result.user.uid,
        result.user.email,
        result.user.displayName || 'Admin User'
      );

      showNotification('Admin account created successfully!', 'success');
      navigate('/admin');
    } catch (error) {
      console.error('Google signup error:', error);
      setErrors(prev => ({
        ...prev,
        general: 'Failed to create admin account with Google'
      }));
      showNotification('Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors(prev => ({ ...prev, general: '' }));

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Create admin profile in Firestore
      await createAdminProfile(
        userCredential.user.uid,
        formData.email,
        formData.displayName
      );

      showNotification('Admin account created successfully!', 'success');
      navigate('/admin');
    } catch (error) {
      console.error('Signup error:', error);

      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'This email is already registered'
        : error.code === 'auth/weak-password'
        ? 'Password is too weak'
        : 'An error occurred during signup. Please try again.';

      setErrors(prev => ({
        ...prev,
        general: errorMessage
      }));
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
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
          {/* Admin Header */}
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
                <AdminIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
            </Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Create Admin Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Register as a platform administrator
            </Typography>
          </Box>

          {/* Error Alert */}
          {errors.general && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.general}
            </Alert>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Full Name"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
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
                value={formData.email}
                onChange={handleChange}
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
                value={formData.password}
                onChange={handleChange}
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
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={loading}
                required
              />

              <TextField
                fullWidth
                select
                label="Admin Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
                helperText="Select your admin role level"
              >
                <MenuItem value="community_admin">Community Admin (Full Access)</MenuItem>
                <MenuItem value="moderator">Moderator (Limited Access)</MenuItem>
              </TextField>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Admin Account'}
              </Button>

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
                Sign up with Google
              </Button>
            </Box>
          </form>

          {/* Info Box */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Note:</strong> Admin accounts have special privileges including:
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Create and manage communities</li>
                <li>Approve user join requests</li>
                <li>Manage users and content</li>
                <li>Access admin dashboard</li>
              </ul>
            </Typography>
          </Box>

          {/* Footer Links */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an admin account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/admin-login')}
                sx={{ fontWeight: 600 }}
              >
                Admin Login
              </Link>
            </Typography>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Not an admin?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/signup')}
                sx={{ fontWeight: 600 }}
              >
                User Signup
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminSignup;
