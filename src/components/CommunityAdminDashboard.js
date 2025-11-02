import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as RequestsIcon,
  Palette as BrandingIcon,
  Settings as SettingsIcon,
  History as LogsIcon,
  TrendingUp as TrendingUpIcon,
  SupervisorAccount as AdminIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { hasPermission, ADMIN_PERMISSIONS } from '../utils/adminUtils';
import { getCommunityStatistics } from '../utils/communityStats';
import AdminOverview from './admin/AdminOverview';
import AdminUserManagement from './admin/AdminUserManagement';
import AdminRequestManagement from './admin/AdminRequestManagement';
import AdminBrandingEditor from './admin/AdminBrandingEditor';
import AdminSettings from './admin/AdminSettings';
import AdminLogs from './admin/AdminLogs';
import AdminManagement from './admin/AdminManagement';
import AdminJoinRequests from './admin/AdminJoinRequests';
import AdminCommunityCreator from './admin/AdminCommunityCreator';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CommunityAdminDashboard = () => {
  const { user, communityId, userProfile } = useAuth();
  const { showNotification } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (isAdmin && communityId) {
      loadStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, communityId]);

  const checkAdminAccess = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user has any admin role
      const hasAdminRole = userProfile?.role && 
        (userProfile.role === 'super_admin' || 
         userProfile.role === 'community_admin' || 
         userProfile.role === 'moderator');
      
      setIsAdmin(hasAdminRole);
      
      if (!hasAdminRole) {
        showNotification('You do not have admin access', 'error');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      showNotification('Error verifying admin access', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getCommunityStatistics(communityId);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      showNotification('Error loading statistics', 'error');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'Overview', icon: <DashboardIcon />, permission: ADMIN_PERMISSIONS.VIEW_STATISTICS },
    { label: 'Communities', icon: <TrendingUpIcon />, permission: ADMIN_PERMISSIONS.MANAGE_SETTINGS },
    { label: 'Join Requests', icon: <PeopleIcon />, permission: ADMIN_PERMISSIONS.MANAGE_USERS },
    { label: 'Users', icon: <PeopleIcon />, permission: ADMIN_PERMISSIONS.VIEW_USERS },
    { label: 'Requests', icon: <RequestsIcon />, permission: ADMIN_PERMISSIONS.VIEW_ALL_REQUESTS },
    { label: 'Branding', icon: <BrandingIcon />, permission: ADMIN_PERMISSIONS.MANAGE_BRANDING },
    { label: 'Admins', icon: <AdminIcon />, permission: ADMIN_PERMISSIONS.MANAGE_ADMINS },
    { label: 'Settings', icon: <SettingsIcon />, permission: ADMIN_PERMISSIONS.MANAGE_SETTINGS },
    { label: 'Activity Logs', icon: <LogsIcon />, permission: ADMIN_PERMISSIONS.VIEW_LOGS }
  ];

  const visibleTabs = tabs.filter(tab => 
    hasPermission(userProfile?.role, tab.permission)
  );

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Admin Dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!isAdmin && !loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>
            You do not have permission to access the community admin dashboard.
            Please make sure you have an admin role assigned.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.href = '/'}
            sx={{ mt: 2 }}
          >
            Go to Home
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <DashboardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Community Admin Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your community settings, users, and content
            </Typography>
          </Box>
          <Chip 
            label={userProfile?.role?.replace('_', ' ').toUpperCase() || 'NO ROLE'} 
            color={isAdmin ? 'primary' : 'error'}
            sx={{ ml: 'auto' }}
          />
        </Box>
        
        {/* Alert if no community */}
        {!communityId && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              👋 Welcome! You need to create or join a community first.
            </Typography>
            <Typography variant="body2">
              Click the <strong>"Communities"</strong> tab below to create your first community.
              Once created, you'll be automatically assigned to it and can access all features!
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Quick Stats */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.users.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RequestsIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.requests.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Requests
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUpIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.engagement.completionRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completion Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AdminIcon color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.engagement.activeVolunteers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Volunteers
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {visibleTabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        {!communityId ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              👋 Welcome to Admin Dashboard!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              To view statistics and manage your community, you need to create a community first.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => setActiveTab(1)}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Go to Communities Tab
            </Button>
          </Paper>
        ) : (
          <AdminOverview statistics={statistics} onRefresh={loadStatistics} />
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <AdminCommunityCreator />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <AdminJoinRequests communityId={communityId} />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <AdminUserManagement communityId={communityId} />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <AdminRequestManagement communityId={communityId} />
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        <AdminBrandingEditor communityId={communityId} />
      </TabPanel>

      <TabPanel value={activeTab} index={6}>
        <AdminManagement communityId={communityId} />
      </TabPanel>

      <TabPanel value={activeTab} index={7}>
        <AdminSettings communityId={communityId} />
      </TabPanel>

      <TabPanel value={activeTab} index={8}>
        <AdminLogs communityId={communityId} />
      </TabPanel>
    </Container>
  );
};

export default CommunityAdminDashboard;
