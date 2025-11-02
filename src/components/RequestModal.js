import React, { useState, useCallback } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  Typography,
  IconButton,
  Chip,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { MyLocation as MyLocationIcon, Close as CloseIcon, AutoAwesome as TemplateIcon } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { COLLECTIONS, MESSAGES } from '../utils/constants';
import { sanitizeInput, sanitizeCoordinates, limitLength } from '../utils/inputSanitization';
import errorTracker from '../utils/errorTracking';
import RequestTemplates from './RequestTemplates';

// Fix marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const REQUEST_CATEGORIES = [
  'General Help',
  'Groceries & Shopping',
  'Medical Assistance',
  'Transportation',
  'Housework & Cleaning',
  'Pet Care',
  'Childcare',
  'Technology Help',
  'Yard Work',
  'Moving & Delivery',
  'Companionship',
  'Other'
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low - Can wait a few days', color: 'success' },
  { value: 'medium', label: 'Medium - Within 24-48 hours', color: 'warning' },
  { value: 'high', label: 'High - Urgent, ASAP', color: 'error' }
];

// Map click handler component
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

const RequestModal = ({ onClose }) => {
  const { user, communityId } = useAuth();
  const { showNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General Help',
    location: '',
    urgency: 'medium',
    contactInfo: '',
    estimatedTime: ''
  });
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    location: ''
  });
  const [showTemplates, setShowTemplates] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Sanitize input
    let sanitizedValue = sanitizeInput(value);
    
    // Apply length limits
    if (name === 'title') {
      sanitizedValue = limitLength(sanitizedValue, 100);
    } else if (name === 'description') {
      sanitizedValue = limitLength(sanitizedValue, 1000);
    } else if (name === 'location') {
      sanitizedValue = limitLength(sanitizedValue, 200);
    } else if (name === 'contactInfo') {
      sanitizedValue = limitLength(sanitizedValue, 100);
    } else if (name === 'estimatedTime') {
      sanitizedValue = limitLength(sanitizedValue, 50);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      showNotification('Geolocation is not supported by your browser', 'error');
      return;
    }

    setLocationError('');
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Validate coordinates
        const validCoords = sanitizeCoordinates(latitude, longitude);
        if (validCoords) {
          setMapPosition(validCoords);
          setShowMap(true);
          showNotification('Location detected successfully', 'success');
        } else {
          setLocationError('Invalid coordinates received');
          showNotification('Invalid location coordinates', 'error');
        }
        setLoading(false);
      },
      (error) => {
        errorTracker.logError(error, { context: 'geolocation' });
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
        }
        
        setLocationError(errorMessage);
        showNotification(errorMessage, 'error');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [showNotification]);

  const validateForm = () => {
    const newErrors = {
      title: '',
      description: '',
      location: ''
    };
    
    // Validate title
    const title = formData.title || '';
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must not exceed 100 characters';
    }
    
    // Validate description
    const description = formData.description || '';
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    } else if (description.trim().length > 1000) {
      newErrors.description = 'Description must not exceed 1000 characters';
    }
    
    // Validate location
    const location = formData.location || '';
    if (!location.trim() && !mapPosition) {
      newErrors.location = 'Please provide a location or use the map';
    }
    
    setErrors(newErrors);
    return !newErrors.title && !newErrors.description && !newErrors.location;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      showNotification('You must be logged in to create a request', 'error');
      return;
    }
    
    // Check if user has a community
    if (!communityId) {
      showNotification('You must join a community before creating requests', 'error');
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      showNotification('Please fix the errors in the form', 'error');
      return;
    }
    
    setLoading(true);

    try {
      // Ensure we have a display name
      const displayName = user.displayName || user.email?.split('@')[0] || 'Anonymous';
      
      // Sanitize all form data (with safety checks)
      const sanitizedData = {
        title: sanitizeInput((formData.title || '').trim()),
        description: sanitizeInput((formData.description || '').trim()),
        category: formData.category || 'General Help',
        urgency: formData.urgency || 'medium',
        contactInfo: sanitizeInput((formData.contactInfo || '').trim()),
        estimatedTime: sanitizeInput((formData.estimatedTime || '').trim())
      };
      
      const requestData = {
        ...sanitizedData,
        status: 'open',
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
        postedBy: displayName,
        postedByEmail: user.email || '',
        createdBy: user.email || '',
        createdByUid: user.uid,
        communityId: communityId,
        views: 0,
        history: [{
          type: 'created',
          by: user.email || 'Unknown',
          byUid: user.uid,
          at: new Date().toISOString()
        }]
      };

      // Add location coordinates if map position is set
      const locationText = (formData.location || '').trim();
      if (mapPosition) {
        const validCoords = sanitizeCoordinates(mapPosition.lat, mapPosition.lng);
        if (validCoords) {
          requestData.location = {
            coordinates: validCoords,
            address: sanitizeInput(locationText)
          };
        }
      } else if (locationText) {
        // Just text location without coordinates
        requestData.location = {
          address: sanitizeInput(locationText)
        };
      }

      await addDoc(collection(db, COLLECTIONS.REQUESTS), requestData);
      
      // Log analytics
      if (window.gtag) {
        window.gtag('event', 'request_created', {
          category: formData.category,
          urgency: formData.urgency
        });
      }
      
      showNotification(MESSAGES.REQUEST_CREATED || 'Request created successfully!');
      onClose();
    } catch (error) {
      errorTracker.logError(error, { context: 'create_request' });
      showNotification(error.message || 'Failed to create request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setFormData(template);
    setShowTemplates(false);
  };

  return (
    <>
      <Dialog 
        open 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        aria-labelledby="request-dialog-title"
      >
        <DialogTitle id="request-dialog-title">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">New Request</Typography>
            <Box>
              <Button
                startIcon={<TemplateIcon />}
                onClick={() => setShowTemplates(true)}
                size="small"
                sx={{ mr: 1 }}
              >
                Use Template
              </Button>
              <IconButton
                aria-label="close"
                onClick={onClose}
                disabled={loading}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                required
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.title}
                helperText={errors.title || `${formData.title.length}/100 characters`}
                inputProps={{
                  'aria-label': 'Request title',
                  maxLength: 100
                }}
              />
              
              <TextField
                required
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.description}
                helperText={errors.description || `${formData.description.length}/1000 characters - Provide detailed information`}
                multiline
                rows={4}
                inputProps={{
                  'aria-label': 'Request description',
                  maxLength: 1000
                }}
              />
              
              <TextField
                required
                fullWidth
                select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
                helperText="What type of help do you need?"
              >
                {REQUEST_CATEGORIES.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                required
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={loading}
                error={!!errors.location}
                placeholder="e.g., Downtown, 123 Main St, or Neighborhood name"
                helperText={errors.location || 'Where is help needed?'}
                inputProps={{
                  'aria-label': 'Request location',
                  maxLength: 200
                }}
              />

              {/* Location Picker */}
              <Box>
                {locationError && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {locationError}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={16} /> : <MyLocationIcon />}
                    onClick={getUserLocation}
                    size="small"
                    fullWidth
                    disabled={loading}
                    aria-label="Use my current location"
                  >
                    {loading ? 'Getting Location...' : 'Use My Location'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowMap(!showMap)}
                    size="small"
                    fullWidth
                  >
                    {showMap ? 'Hide Map' : 'Pick on Map'}
                  </Button>
                </Box>

                {mapPosition && (
                  <Chip
                    label={`📍 ${mapPosition.lat.toFixed(4)}, ${mapPosition.lng.toFixed(4)}`}
                    onDelete={() => setMapPosition(null)}
                    color="primary"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                )}

                {showMap && (
                  <Paper elevation={2} sx={{ height: 300, overflow: 'hidden', borderRadius: 1 }}>
                    <MapContainer
                      center={mapPosition || [20.5937, 78.9629]}
                      zoom={mapPosition ? 15 : 5}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                    </MapContainer>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', p: 1, textAlign: 'center' }}>
                      Click on the map to set your location
                    </Typography>
                  </Paper>
                )}
              </Box>
              
              <TextField
                required
                fullWidth
                select
                label="Urgency Level"
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                disabled={loading}
                helperText="How soon do you need help?"
              >
                {URGENCY_LEVELS.map(level => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                label="Estimated Time Needed"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g., 1-2 hours, 30 minutes"
                helperText="Optional: How long might this take?"
              />
              
              <TextField
                fullWidth
                label="Contact Information"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleChange}
                disabled={loading}
                placeholder="Phone number or preferred contact method"
                helperText="Optional: How should volunteers reach you?"
              />
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              Create Request
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Request Templates Dialog */}
      <RequestTemplates
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  );
};

export default RequestModal;
