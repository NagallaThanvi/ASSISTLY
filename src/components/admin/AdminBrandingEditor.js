import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import {
  getCommunityBranding,
  updateCommunityBranding,
  validateBranding,
  COLOR_PRESETS,
  DEFAULT_BRANDING
} from '../../utils/brandingUtils';
import { useApp } from '../../context/AppContext';

const AdminBrandingEditor = ({ communityId }) => {
  const { showNotification } = useApp();
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    loadBranding();
  }, [communityId]);

  const loadBranding = async () => {
    try {
      const brandingData = await getCommunityBranding(communityId);
      setBranding(brandingData);
    } catch (error) {
      console.error('Error loading branding:', error);
      showNotification('Error loading branding', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (field, value) => {
    setBranding(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [field]: value
      }
    }));
  };

  const handleFieldChange = (field, value) => {
    setBranding(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyPreset = (presetKey) => {
    const preset = COLOR_PRESETS[presetKey];
    if (preset) {
      setBranding(prev => ({
        ...prev,
        colors: preset.colors
      }));
      showNotification(`Applied ${preset.name} preset`, 'success');
    }
  };

  const handleSave = async () => {
    const validation = validateBranding(branding);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      showNotification('Please fix validation errors', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateCommunityBranding(communityId, branding);
      showNotification('Branding updated successfully!', 'success');
      setErrors([]);
    } catch (error) {
      console.error('Error saving branding:', error);
      showNotification('Error saving branding', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Community Branding
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadBranding}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Color Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Color Scheme
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Primary Color"
                type="color"
                value={branding.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                fullWidth
              />
              <TextField
                label="Secondary Color"
                type="color"
                value={branding.colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                fullWidth
              />
              <TextField
                label="Accent Color"
                type="color"
                value={branding.colors.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                fullWidth
              />
              <TextField
                label="Background Color"
                type="color"
                value={branding.colors.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
                fullWidth
              />
              <TextField
                label="Text Color"
                type="color"
                value={branding.colors.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
                fullWidth
              />
            </Box>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Color Presets
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  size="small"
                  variant="outlined"
                  onClick={() => applyPreset(key)}
                >
                  {preset.name}
                </Button>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Text Content */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Text Content
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Community Tagline"
                value={branding.tagline}
                onChange={(e) => handleFieldChange('tagline', e.target.value)}
                fullWidth
                helperText="Short tagline for your community (max 100 characters)"
              />
              <TextField
                label="Welcome Message"
                value={branding.welcomeMessage}
                onChange={(e) => handleFieldChange('welcomeMessage', e.target.value)}
                fullWidth
                multiline
                rows={3}
                helperText="Welcome message shown to new users (max 500 characters)"
              />
              <TextField
                label="Logo URL"
                value={branding.logo || ''}
                onChange={(e) => handleFieldChange('logo', e.target.value)}
                fullWidth
                helperText="URL to your community logo image"
              />
              <TextField
                label="Banner URL"
                value={branding.banner || ''}
                onChange={(e) => handleFieldChange('banner', e.target.value)}
                fullWidth
                helperText="URL to your community banner image"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Preview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Card
              sx={{
                background: `linear-gradient(135deg, ${branding.colors.primary} 0%, ${branding.colors.secondary} 100%)`,
                color: 'white',
                p: 3,
                textAlign: 'center'
              }}
            >
              {branding.logo && (
                <Box
                  component="img"
                  src={branding.logo}
                  alt="Logo"
                  sx={{ maxHeight: 60, mb: 2 }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {branding.tagline}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {branding.welcomeMessage}
              </Typography>
            </Card>

            <Box sx={{ mt: 3, p: 2, bgcolor: branding.colors.background, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: branding.colors.text }}>
                Sample text with your custom text color
              </Typography>
              <Button
                variant="contained"
                sx={{
                  mt: 2,
                  bgcolor: branding.colors.primary,
                  '&:hover': { bgcolor: branding.colors.secondary }
                }}
              >
                Sample Button
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Custom CSS */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Custom CSS (Advanced)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField
              value={branding.customCSS || ''}
              onChange={(e) => handleFieldChange('customCSS', e.target.value)}
              fullWidth
              multiline
              rows={6}
              placeholder="/* Add custom CSS here */"
              helperText="Advanced: Add custom CSS to further customize your community's appearance"
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminBrandingEditor;
