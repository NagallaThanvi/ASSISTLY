import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Link,
  CircularProgress,
  Divider,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  LinearProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  Google as GoogleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { auth } from '../firebase';
import { useApp } from '../context/AppContext';
import { ROUTES, MESSAGES } from '../utils/constants';
import { Link as RouterLink } from 'react-router-dom';
import { sanitizeEmail, sanitizeInput } from '../utils/inputSanitization';
import { validateEmail, validatePassword, authRateLimiter } from '../utils/validation';
import errorTracker from '../utils/errorTracking';

const SignUp = () => {
  const navigate = useNavigate();
  const { showNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const googleProvider = new GoogleAuthProvider();
  // Force account selection every time
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  // Calculate password strength
  const calculatePasswordStrength = useCallback((password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    return Math.min(strength, 100);
  }, []);

  const getPasswordStrengthColor = (strength) => {
    if (strength < 40) return 'error';
    if (strength < 70) return 'warning';
    return 'success';
  };

  const getPasswordStrengthLabel = (strength) => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  const handleGoogleSignUp = async () => {
    // Check rate limiting
    const isLimited = await authRateLimiter.isRateLimited('google_signup');
    if (isLimited) {
      setError('Too many attempts. Please try again in a few minutes.');
      showNotification('Too many attempts. Please wait.', 'error');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (window.gtag) {
        window.gtag('event', 'sign_up', {
          method: 'google'
        });
      }
      showNotification(MESSAGES.SIGNUP_SUCCESS);
      await authRateLimiter.clearAttempts('google_signup');
      navigate(ROUTES.HOME);
    } catch (error) {
      errorTracker.logError(error, { context: 'google_signup' });
      setError('Failed to sign up with Google. Please try again.');
      showNotification('Sign up failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Sanitize input
    let sanitizedValue = value;
    if (name === 'email') {
      sanitizedValue = sanitizeEmail(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Calculate password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(sanitizedValue));
    }
    
    // Clear errors
    setError('');
    setFieldErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  }, [calculatePasswordStrength]);

  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
      confirmPassword: ''
    };
    
    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) {
      errors.email = emailError;
    }
    
    // Validate password
    const passwordError = validatePassword(formData.password, true);
    if (passwordError) {
      errors.password = passwordError;
    }
    
    // Check password strength
    if (passwordStrength < 40) {
      errors.password = 'Password is too weak. Please use a stronger password.';
    }
    
    // Validate confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFieldErrors(errors);
    return !errors.email && !errors.password && !errors.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Check rate limiting
    const isLimited = await authRateLimiter.isRateLimited(formData.email);
    if (isLimited) {
      setError('Too many signup attempts. Please try again in a few minutes.');
      showNotification('Too many attempts. Please wait.', 'error');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      if (window.gtag) {
        window.gtag('event', 'sign_up', {
          method: 'email'
        });
      }
      
      showNotification(MESSAGES.SIGNUP_SUCCESS);
      await authRateLimiter.clearAttempts(formData.email);
      navigate(ROUTES.HOME);
    } catch (error) {
      errorTracker.logError(error, { context: 'email_signup' });
      
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Please login instead.'
        : error.code === 'auth/weak-password'
        ? 'Password is too weak. Please use a stronger password.'
        : error.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : 'An error occurred during signup. Please try again.';
      
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box 
        sx={{
          display: 'flex',
          minHeight: '100vh',
          p: 3,
          gap: 4
        }}
      >
        {/* Product Information Section */}
        <Box
          sx={{
            flex: 1,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            pr: 4
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
            Join Our Community
          </Typography>
          <Typography variant="h5" gutterBottom color="textSecondary">
            Make a Difference in Your Neighborhood
          </Typography>
          <Box sx={{ my: 4 }}>
            <Typography variant="body1" paragraph>
              Create an account to:
            </Typography>
            <Typography component="ul" sx={{ pl: 2 }}>
              <li>Post and respond to community requests</li>
              <li>Track your impact and contributions</li>
              <li>Connect with neighbors and volunteers</li>
              <li>Receive notifications about local needs</li>
            </Typography>
          </Box>
        </Box>

        {/* Sign Up Form Section */}
        <Paper 
          elevation={3} 
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignSelf: 'center'
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom align="center">
            Create Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Google Sign Up Button */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSignUp}
            disabled={loading}
            startIcon={<GoogleIcon />}
            sx={{ 
              py: 1.5, 
              textTransform: 'none',
              mb: 2
            }}
          >
            Continue with Google
          </Button>

          <Divider sx={{ mb: 2 }}>OR</Divider>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextField
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              autoComplete="email"
              autoFocus
              inputProps={{
                'aria-label': 'Email address',
                maxLength: 100
              }}
            />
            
            <TextField
              required
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password || 'Must be at least 8 characters with letters and numbers'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <Box sx={{ mt: -1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength}
                    color={getPasswordStrengthColor(passwordStrength)}
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color={getPasswordStrengthColor(passwordStrength) + '.main'}>
                    {getPasswordStrengthLabel(passwordStrength)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography variant="caption" color={formData.password.length >= 8 ? 'success.main' : 'text.secondary'} sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    {formData.password.length >= 8 ? <CheckIcon sx={{ fontSize: 14 }} /> : <CancelIcon sx={{ fontSize: 14 }} />}
                    8+ chars
                  </Typography>
                  <Typography variant="caption" color={/[A-Z]/.test(formData.password) ? 'success.main' : 'text.secondary'} sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    {/[A-Z]/.test(formData.password) ? <CheckIcon sx={{ fontSize: 14 }} /> : <CancelIcon sx={{ fontSize: 14 }} />}
                    Uppercase
                  </Typography>
                  <Typography variant="caption" color={/[0-9]/.test(formData.password) ? 'success.main' : 'text.secondary'} sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    {/[0-9]/.test(formData.password) ? <CheckIcon sx={{ fontSize: 14 }} /> : <CancelIcon sx={{ fontSize: 14 }} />}
                    Number
                  </Typography>
                  <Typography variant="caption" color={/[^a-zA-Z0-9]/.test(formData.password) ? 'success.main' : 'text.secondary'} sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    {/[^a-zA-Z0-9]/.test(formData.password) ? <CheckIcon sx={{ fontSize: 14 }} /> : <CancelIcon sx={{ fontSize: 14 }} />}
                    Special char
                  </Typography>
                </Box>
              </Box>
            )}

          <TextField
            required
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            error={!!fieldErrors.confirmPassword}
            helperText={fieldErrors.confirmPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>
        </form>
        
        <Box textAlign="center" mt={2}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Login here
            </Link>
          </Typography>
        </Box>

        {/* Admin Login Link */}
        <Divider sx={{ my: 2 }}>
          <Typography variant="caption" color="text.secondary">
            OR
          </Typography>
        </Divider>
        
        <Box sx={{ textAlign: 'center' }}>
          <Button
            onClick={() => navigate('/admin-login')}
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{
              py: 1.5,
              borderWidth: 2,
              fontWeight: 600,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              '&:hover': {
                borderWidth: 2,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              }
            }}
          >
            🔐 Admin Login
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            For administrators and moderators only
          </Typography>
        </Box>
      </Paper>
      </Box>
    </Container>
  );
};

export default SignUp;
