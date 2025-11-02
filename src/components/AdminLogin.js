import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
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
  IconButton
} from '@mui/material';
import { auth, db } from '../firebase';
import { useApp } from '../context/AppContext';
import { ROUTES, MESSAGES } from '../utils/constants';
import { useEffect } from 'react';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  Visibility, 
  VisibilityOff,
  Google as GoogleIcon,
  AdminPanelSettings as AdminIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../utils/constants';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const AdminLogin = () => {
  const navigate = useNavigate();
  const { showNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });

  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch(error => {
        console.error('Auth persistence error:', error);
      });
  }, []);

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      general: ''
    };
    
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

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const checkAdminRole = async (userId) => {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const isAdmin = userData.role && 
          (userData.role === 'super_admin' || 
           userData.role === 'community_admin' || 
           userData.role === 'moderator');
        
        return isAdmin;
      }
      return false;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  };

  const handleChange = React.useCallback((e) => {
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
  }, [errors]);

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setErrors(prev => ({ ...prev, general: '' }));

    try {
      const result = await signInWithPopup(auth, provider);
      
      // Check if user is admin
      const isAdmin = await checkAdminRole(result.user.uid);
      
      if (!isAdmin) {
        await auth.signOut();
        setErrors(prev => ({
          ...prev,
          general: 'Access denied. Admin privileges required.'
        }));
        showNotification('Access denied. Admin privileges required.', 'error');
        setLoading(false);
        return;
      }

      if (window.gtag) {
        window.gtag('event', 'admin_login', {
          method: provider.providerId
        });
      }
      
      showNotification('Admin login successful!');
      navigate('/admin');
    } catch (error) {
      console.error('Social login error:', error);
      setErrors(prev => ({
        ...prev,
        general: 'Failed to sign in with ' + provider.providerId
      }));
      showNotification('Authentication failed', 'error');
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
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Check if user is admin
      const isAdmin = await checkAdminRole(userCredential.user.uid);
      
      if (!isAdmin) {
        await auth.signOut();
        setErrors(prev => ({
          ...prev,
          general: 'Access denied. Admin privileges required.'
        }));
        showNotification('Access denied. Admin privileges required.', 'error');
        setLoading(false);
        return;
      }
      
      if (window.gtag) {
        window.gtag('event', 'admin_login', {
          method: 'email'
        });
      }

      showNotification('Admin login successful!');
      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found'
        ? 'Invalid email or password'
        : error.code === 'auth/too-many-requests'
        ? 'Too many failed attempts. Please try again later'
        : 'An error occurred during login. Please try again.';

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
              Admin Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Restricted access for administrators only
            </Typography>
          </Box>

          {/* Error Alert */}
          {errors.general && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.general}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                disabled={loading}
                autoComplete="current-password"
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
                {loading ? <CircularProgress size={24} /> : 'Login as Admin'}
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
                onClick={() => handleSocialLogin(googleProvider)}
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                Sign in with Google
              </Button>
            </Box>
          </form>

          {/* Footer Links */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
              sx={{ textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon fontSize="small" />
              <strong>Admin Access Only:</strong> This page is restricted to authorized administrators.
              Regular users should use the standard login page.
            </Typography>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an admin account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/admin-signup')}
                sx={{ fontWeight: 600 }}
              >
                Create Admin Account
              </Link>
            </Typography>
          </Box>

          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Not an admin?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate(ROUTES.LOGIN)}
                sx={{ fontWeight: 600 }}
              >
                User Login
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLogin;
