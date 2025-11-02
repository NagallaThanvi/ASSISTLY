/**
 * Database Initializer Component
 * Provides UI to fix database structure and create admin users
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import {
  migrateDatabaseStructure,
  createSuperAdmin,
  fixCommunityAdmins,
  verifyDatabaseStructure,
  initializeDatabase
} from '../utils/databaseMigration';

const steps = [
  'Verify Structure',
  'Run Migration',
  'Create Admin',
  'Complete'
];

export default function DatabaseInitializer({ open, onClose }) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [results, setResults] = useState({
    verification: null,
    migration: null,
    adminCreation: null
  });
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await verifyDatabaseStructure();
      setResults(prev => ({ ...prev, verification: result }));
      setActiveStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    setLoading(true);
    setError('');
    try {
      const migrationResult = await migrateDatabaseStructure();
      const fixResult = await fixCommunityAdmins();
      setResults(prev => ({ 
        ...prev, 
        migration: { ...migrationResult, ...fixResult }
      }));
      setActiveStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminEmail) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await createSuperAdmin(adminEmail);
      setResults(prev => ({ ...prev, adminCreation: result }));
      setActiveStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFix = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await initializeDatabase();
      setResults({
        verification: result,
        migration: { success: true },
        adminCreation: null
      });
      setActiveStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setResults({
      verification: null,
      migration: null,
      adminCreation: null
    });
    setError('');
    setAdminEmail('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon color="primary" />
          <Typography variant="h6">Database Setup & Fix</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Step 0: Verify */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="body1" gutterBottom>
              First, let's check your database structure for any issues.
            </Typography>
            
            {results.verification && (
              <Box sx={{ mt: 2 }}>
                {results.verification.success ? (
                  <Alert severity="success" icon={<CheckIcon />}>
                    Database structure is correct!
                  </Alert>
                ) : (
                  <Alert severity="warning" icon={<WarningIcon />}>
                    <Typography variant="subtitle2" gutterBottom>
                      Issues Found:
                    </Typography>
                    <List dense>
                      {results.verification.issues.map((issue, idx) => (
                        <ListItem key={idx}>
                          <ListItemText primary={issue} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleVerify}
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Checking...' : 'Verify Database'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleAutoFix}
                disabled={loading}
                color="secondary"
              >
                Auto-Fix Everything
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 1: Migrate */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="body1" gutterBottom>
              Run migration to fix database structure issues.
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              This will:
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Add missing role fields to users" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Convert old communityId to new communities map" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Fix community admin assignments" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Add default values for missing fields" />
                </ListItem>
              </List>
            </Alert>

            {results.migration && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Migration completed! Updated {results.migration.updatedCount} documents.
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={handleMigrate}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Migrating...' : 'Run Migration'}
            </Button>
          </Box>
        )}

        {/* Step 2: Create Admin */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="body1" gutterBottom>
              Create a super admin user to manage the platform.
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              Enter the email of a registered user to make them a super admin.
              If the user doesn't exist, please register first.
            </Alert>

            <TextField
              fullWidth
              label="Admin Email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              sx={{ mb: 2 }}
              disabled={loading}
            />

            {results.adminCreation && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Super admin created successfully!
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={handleCreateAdmin}
              disabled={loading || !adminEmail}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Creating...' : 'Create Super Admin'}
            </Button>
          </Box>
        )}

        {/* Step 3: Complete */}
        {activeStep === 3 && (
          <Box>
            <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Setup Complete!
              </Typography>
              <Typography variant="body2">
                Your database is now properly configured and ready to use.
              </Typography>
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              What's been done:
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Database Structure Fixed"
                  secondary="All users and communities have correct fields"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Admin User Created"
                  secondary={`Super admin: ${adminEmail}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Community Links Fixed"
                  secondary="Admin-user-community relationships are properly linked"
                />
              </ListItem>
            </List>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Next Steps:</strong>
              </Typography>
              <Typography variant="body2">
                1. Log out and log back in to refresh your session<br />
                2. You can now create communities (admin only)<br />
                3. Users can request to join communities<br />
                4. Admins can approve/reject join requests
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {activeStep === 3 ? (
          <>
            <Button onClick={handleReset}>Run Again</Button>
            <Button variant="contained" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Cancel</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
