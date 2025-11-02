import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Button, Container, ToggleButtonGroup, ToggleButton, IconButton, ThemeProvider, createTheme } from '@mui/material';
import { VolunteerActivism as VolunteerIcon, Home as HomeIcon, Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon, Map as MapIcon, ViewList as ListIcon, Handshake as HandshakeIcon, Favorite as FavoriteIcon } from '@mui/icons-material';
import { collection, doc, query, where, orderBy, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { useApp } from './context/AppContext';
import { ROUTES, MESSAGES } from './utils/constants';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { awardPointsForCompletion, trackEarlyClaim } from './utils/gamification';

// Components
import Login from './components/Login';
import SignUp from './components/SignUp';
import RequestCard from './components/RequestCard';
import RequestModal from './components/RequestModal';
import MessageThread from './components/MessageThread';
import ForgotPassword from './components/ForgotPassword';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import NotificationCenter from './components/NotificationCenter';
import AdvancedSearch from './components/AdvancedSearch';
import MapView from './components/MapView';
import CommunityBadge from './components/CommunityBadge';
import CommunityAdminDashboard from './components/CommunityAdminDashboard';
import PendingJoinRequest from './components/PendingJoinRequest';
import AdminLogin from './components/AdminLogin';
import AdminSignup from './components/AdminSignup';
import CreateCommunityPage from './pages/CreateCommunityPage';
import CommunityListPage from './pages/CommunityListPage';
import CommunityPage from './pages/CommunityPage';
import AdminPage from './pages/AdminPage';
import Chatbot from './components/Chatbot';
import DatabaseInitializer from './components/DatabaseInitializer';

// Meta tags setup
document.title = process.env.REACT_APP_NAME || 'Assistly';
const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) {
  metaDescription.setAttribute('content', process.env.REACT_APP_DESCRIPTION || 'Your trusted community assistance platform - connecting neighbors who care');
}

// Protected Route Component
const ProtectedRoute = React.memo(({ children }) => {
  const { user, communityId, userProfile, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }
  
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} />;
  }
  
  // If user has completed onboarding but has no community, show pending request screen
  if (userProfile?.onboardingCompleted && !communityId) {
    return <PendingJoinRequest />;
  }
  
  return children;
});

function App() {
  const { user, communityId, userProfile, loading } = useAuth();
  const { showNotification } = useApp();
  const [requests, setRequests] = React.useState([]);
  const [filteredRequests, setFilteredRequests] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterUrgency, setFilterUrgency] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('newest');
  const [currentMode, setCurrentMode] = React.useState('resident'); // 'resident' or 'volunteer'
  const [openChatRequest, setOpenChatRequest] = React.useState(null);
  const [darkMode, setDarkMode] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('list'); // 'list' or 'map'
  const [showDbInitializer, setShowDbInitializer] = React.useState(false);

  // Create theme based on dark mode
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: darkMode ? '#9c27b0' : '#667eea',
          },
          secondary: {
            main: darkMode ? '#f48fb1' : '#764ba2',
          },
        },
      }),
    [darkMode]
  );

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  // Load dark mode preference from localStorage
  React.useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    }
  }, []);

  // Seed communities on first load
  React.useEffect(() => {
    const initializeCommunities = async () => {
      try {
        const { seedDefaultCommunities } = await import('./utils/seedCommunities');
        await seedDefaultCommunities();
      } catch (error) {
        console.error('Error initializing communities:', error);
      }
    };
    
    initializeCommunities();
  }, []);

  // Initialize trust score scheduler
  React.useEffect(() => {
    if (communityId) {
      const initScheduler = async () => {
        try {
          const { initializeTrustScoreScheduler, updateOutdatedTrustScores } = await import('./utils/trustScoreScheduler');
          
          // Update outdated scores on app load
          await updateOutdatedTrustScores(communityId);
          
          // Initialize daily scheduler
          initializeTrustScoreScheduler(communityId);
          
          console.log('Trust score scheduler initialized');
        } catch (error) {
          console.error('Error initializing trust score scheduler:', error);
        }
      };
      
      initScheduler();
    }
  }, [communityId]);

  // Filter options are defined in AdvancedSearch component

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification(MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      showNotification('Logout failed. Please try again.', 'error');
    }
  };

  // Fetch requests from Firestore
  React.useEffect(() => {
    if (!user || !communityId) return;

    const q = query(
      collection(db, 'requests'),
      where('communityId', '==', communityId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData);
      setFilteredRequests(requestsData);
    });

    return () => unsubscribe();
  }, [user, communityId]);

  // Filter, search, and sort requests
  React.useEffect(() => {
    let filtered = [...requests];

    // Mode-based filtering
    if (currentMode === 'resident') {
      // Resident mode: See own requests + all open requests from others
      filtered = filtered.filter(req => 
        req.createdByUid === user?.uid || req.status === 'open'
      );
    }
    // Volunteer mode: See all requests (to help anyone)

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(req => req.category === filterCategory);
    }

    // Urgency filter
    if (filterUrgency !== 'all') {
      filtered = filtered.filter(req => req.urgency === filterUrgency);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        case 'oldest':
          return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        case 'urgency-high':
          const urgencyOrder = { high: 3, medium: 2, low: 1 };
          return (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0);
        case 'urgency-low':
          const urgencyOrderLow = { high: 3, medium: 2, low: 1 };
          return (urgencyOrderLow[a.urgency] || 0) - (urgencyOrderLow[b.urgency] || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    setFilteredRequests(filtered);
  }, [requests, searchTerm, filterCategory, filterUrgency, filterStatus, sortBy, currentMode, user]);

  const activeFiltersCount = [filterCategory, filterUrgency, filterStatus].filter(f => f !== 'all').length;

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setCurrentMode(newMode);
      showNotification(`Switched to ${newMode === 'resident' ? 'Resident' : 'Volunteer'} Mode`);
    }
  };

  const handleAdvancedSearch = (filters) => {
    setSearchTerm(filters.searchTerm);
    setFilterCategory(filters.category);
    setFilterUrgency(filters.urgency);
    setFilterStatus(filters.status);
    setSortBy(filters.sortBy);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterUrgency('all');
    setFilterStatus('all');
    setSortBy('newest');
  };

  const handleVolunteer = async (requestId) => {
    if (!user) return;

    try {
      const requestRef = doc(db, 'requests', requestId);
      const request = requests.find(req => req.id === requestId);
      
      await updateDoc(requestRef, {
        status: 'claimed',
        claimedByUid: user.uid,
        claimedBy: user.email,
        claimedAt: serverTimestamp(),
        history: arrayUnion({ 
          type: 'claimed',
          by: user.email,
          byUid: user.uid,
          at: new Date().toISOString()
        })
      });
      
      // Track early claim for gamification
      if (request?.createdAt) {
        await trackEarlyClaim(user.uid, request.createdAt);
      }
      
      // Get the request details to open chat
      if (request) {
        setOpenChatRequest(request);
      }
      
      showNotification('Request claimed! Chat opened with requester.');
    } catch (error) {
      console.error('Error claiming request:', error);
      showNotification('Failed to claim request', 'error');
    }
  };

  const handleMarkComplete = async (requestId, verificationData = null) => {
    if (!user) return;
    try {
      const requestRef = doc(db, 'requests', requestId);
      const updateData = {
        status: 'pending_completion', // Changed from 'completed'
        completedByUid: user.uid,
        completedBy: user.email,
        completedAt: serverTimestamp(),
        history: arrayUnion({ 
          type: 'marked_complete', 
          byUid: user.uid, 
          by: user.email, 
          at: new Date().toISOString() 
        })
      };

      // Add location verification data if provided
      if (verificationData) {
        updateData.verification = {
          location: verificationData.userLocation,
          distance: verificationData.distance,
          timestamp: verificationData.timestamp,
          verified: verificationData.verified
        };
      }

      await updateDoc(requestRef, updateData);
      showNotification('Marked as complete! Waiting for resident verification.');
    } catch (error) {
      showNotification('Error completing request. Please try again.', 'error');
    }
  };

  const handleVerifyCompletion = async (requestId, approved) => {
    if (!user) return;
    try {
      const requestRef = doc(db, 'requests', requestId);
      const request = requests.find(req => req.id === requestId);
      
      if (approved) {
        await updateDoc(requestRef, {
          status: 'completed',
          verifiedByUid: user.uid,
          verifiedBy: user.email,
          verifiedAt: serverTimestamp(),
          history: arrayUnion({ 
            type: 'verified_complete', 
            byUid: user.uid, 
            by: user.email, 
            at: new Date().toISOString() 
          })
        });
        
        // Award points to volunteer for completing the request
        if (request?.claimedByUid) {
          try {
            const claimTime = request.claimedAt?.toMillis ? request.claimedAt.toMillis() : Date.now();
            const completionTime = Date.now() - claimTime;
            
            const reward = await awardPointsForCompletion(
              request.claimedByUid,
              request,
              completionTime
            );
            
            // Show achievement notification if any
            if (reward.newAchievements && reward.newAchievements.length > 0) {
              const achievementNames = reward.newAchievements.map(a => a.name).join(', ');
              showNotification(
                `🎉 New Achievement${reward.newAchievements.length > 1 ? 's' : ''}: ${achievementNames}!`,
                'success'
              );
            }
            
            // Show level up notification
            if (reward.leveledUp) {
              showNotification(
                `🎊 Level Up! You're now a ${reward.newLevel.name} ${reward.newLevel.badge}!`,
                'success'
              );
            }
          } catch (gamificationError) {
            console.error('Error awarding points:', gamificationError);
            // Don't fail the whole operation if gamification fails
          }
        }
        
        showNotification('Request verified as completed! You can now rate the volunteer.');
      } else {
        await updateDoc(requestRef, {
          status: 'claimed', // Back to claimed
          history: arrayUnion({ 
            type: 'completion_rejected', 
            byUid: user.uid, 
            by: user.email, 
            at: new Date().toISOString() 
          })
        });
        showNotification('Completion rejected. Request reopened.');
      }
    } catch (error) {
      console.error('Error verifying completion:', error);
      showNotification('Error verifying completion. Please try again.', 'error');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <CssBaseline />
        <AppBar position="static" sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <Toolbar sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1 }}>
              <HandshakeIcon sx={{ fontSize: 32, color: '#fff' }} />
              <Typography 
                variant="h5" 
                component="div" 
                sx={{ 
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {process.env.REACT_APP_NAME || 'Assistly'}
              </Typography>
            </Box>
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CommunityBadge />
                <Button color="inherit" component={Link} to={ROUTES.HOME}>
                  Requests
                </Button>
                <Button color="inherit" component={Link} to={ROUTES.DASHBOARD}>
                  Dashboard
                </Button>
                <Button color="inherit" component={Link} to="/profile">
                  Profile
                </Button>
                <Button color="inherit" component={Link} to="/communities">
                  Communities
                </Button>
                
                {/* Database Setup Button - Show for all users initially */}
                <Button 
                  color="inherit" 
                  onClick={() => setShowDbInitializer(true)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    fontSize: '0.85rem',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.25)',
                    }
                  }}
                >
                  🔧 Setup
                </Button>

                {/* Admin Button - Show only for admins */}
                {userProfile?.role && (userProfile.role === 'super_admin' || userProfile.role === 'community_admin' || userProfile.role === 'moderator') && (
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/admin"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      fontWeight: 700,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                      }
                    }}
                  >
                    👑 Admin
                  </Button>
                )}
                
                {/* Mode Toggle */}
                <ToggleButtonGroup
                  value={currentMode}
                  exclusive
                  onChange={handleModeChange}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.15)',
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '& .MuiToggleButton-root': {
                      color: 'rgba(255,255,255,0.8)',
                      border: 'none',
                      px: 2.5,
                      py: 0.75,
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(255,255,255,0.95)',
                        color: '#667eea',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,1)'
                        }
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.25)'
                      }
                    }
                  }}
                >
                  <ToggleButton value="resident">
                    <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
                    Resident
                  </ToggleButton>
                  <ToggleButton value="volunteer">
                    <VolunteerIcon sx={{ mr: 0.5, fontSize: 20 }} />
                    Volunteer
                  </ToggleButton>
                </ToggleButtonGroup>
                
                <NotificationCenter />
                
                <IconButton color="inherit" onClick={toggleDarkMode} sx={{ mr: 1 }}>
                  {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
                
                <Typography variant="body1">
                  {user.displayName || user.email.split('@')[0]}
                </Typography>
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button color="inherit" component={Link} to={ROUTES.LOGIN}>
                  Login
                </Button>
                <Button color="inherit" component={Link} to={ROUTES.SIGNUP}>
                  Sign Up
                </Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Routes>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path={ROUTES.SIGNUP} element={<SignUp />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.TERMS} element={<TermsOfService />} />
          <Route path={ROUTES.PRIVACY} element={<PrivacyPolicy />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <CommunityAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities"
            element={
              <ProtectedRoute>
                <CommunityListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-community"
            element={
              <ProtectedRoute>
                <CreateCommunityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community/:communityId"
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/:communityId"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.HOME}
            element={
              <ProtectedRoute>
                <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
                  {/* Mode-based Header */}
                  <Box sx={{ 
                    mb: 4, 
                    p: 3, 
                    background: currentMode === 'volunteer' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '200px',
                      height: '200px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '50%',
                      transform: 'translate(50%, -50%)'
                    }
                  }}>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        {currentMode === 'volunteer' ? (
                          <VolunteerIcon sx={{ fontSize: 32 }} />
                        ) : (
                          <HomeIcon sx={{ fontSize: 32 }} />
                        )}
                        <Typography variant="h4" fontWeight="700" letterSpacing="-0.5px">
                          {currentMode === 'volunteer' ? 'Volunteer Mode' : 'Resident Mode'}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ opacity: 0.95, fontSize: '1.05rem' }}>
                        {currentMode === 'volunteer' 
                          ? 'Browse and accept requests to help community members' 
                          : 'Post your requests and get help from volunteers'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    {currentMode === 'resident' && (
                      <Button
                        variant="contained"
                        onClick={() => setShowModal(true)}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          fontWeight: 600,
                          fontSize: '1rem',
                          textTransform: 'none',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)'
                          }
                        }}
                      >
                        <FavoriteIcon sx={{ mr: 1, fontSize: 20 }} />
                        New Request
                      </Button>
                    )}
                    
                    <Typography variant="body2" color="text.secondary" sx={{ ml: currentMode === 'volunteer' ? 0 : 'auto' }}>
                      {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} found
                    </Typography>
                  </Box>

                  {/* Advanced Search Component */}
                  <AdvancedSearch 
                    onSearch={handleAdvancedSearch}
                    onClear={handleClearFilters}
                  />

                  {/* View Toggle Buttons */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <ToggleButtonGroup
                      value={viewMode}
                      exclusive
                      onChange={(e, newMode) => newMode && setViewMode(newMode)}
                      sx={{
                        backgroundColor: 'background.paper',
                        boxShadow: 1
                      }}
                    >
                      <ToggleButton value="list">
                        <ListIcon sx={{ mr: 0.5 }} />
                        List View
                      </ToggleButton>
                      <ToggleButton value="map">
                        <MapIcon sx={{ mr: 0.5 }} />
                        Map View
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {showModal && (
                    <RequestModal
                      onClose={() => setShowModal(false)}
                    />
                  )}

                  {/* Map View */}
                  {viewMode === 'map' ? (
                    <MapView 
                      requests={filteredRequests}
                      onRequestClick={(request) => {
                        // Scroll to request or open details
                        console.log('Request clicked:', request);
                      }}
                    />
                  ) : (
                    /* List View */
                    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {loading ? (
                      <LoadingSpinner />
                    ) : filteredRequests.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 8, gridColumn: '1 / -1' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No requests found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {searchTerm || activeFiltersCount > 0 
                            ? 'Try adjusting your search or filters' 
                            : 'Be the first to create a request!'}
                        </Typography>
                      </Box>
                    ) : filteredRequests.map(request => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        currentUser={user}
                        onVolunteer={handleVolunteer}
                        onComplete={handleMarkComplete}
                        onVerifyCompletion={handleVerifyCompletion}
                      />
                    ))}
                    </Box>
                  )}
                </Container>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={ROUTES.HOME} />} />
        </Routes>

        {/* Auto-open Chat when volunteer accepts request */}
        {openChatRequest && user && (
          <MessageThread
            open={true}
            onClose={() => setOpenChatRequest(null)}
            requestId={openChatRequest.id}
            requestTitle={openChatRequest.title}
            otherUserId={openChatRequest.createdByUid}
            otherUserEmail={openChatRequest.createdBy || openChatRequest.createdByEmail}
          />
        )}

        {/* AI Chatbot - Available to all logged-in users */}
        {user && <Chatbot />}

        {/* Database Initializer Dialog */}
        <DatabaseInitializer 
          open={showDbInitializer} 
          onClose={() => setShowDbInitializer(false)} 
        />
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
