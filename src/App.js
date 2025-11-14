import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Button, Container, ToggleButtonGroup, ToggleButton, IconButton, ThemeProvider, createTheme } from '@mui/material';
import { COLORS, TYPOGRAPHY } from './utils/designSystem';
import { alpha } from '@mui/material/styles';

import { VolunteerActivism as VolunteerIcon, Home as HomeIcon, Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon, Map as MapIcon, ViewList as ListIcon, Favorite as FavoriteIcon } from '@mui/icons-material';
import { collection, doc, query, where, orderBy, onSnapshot, updateDoc, arrayUnion, serverTimestamp, addDoc, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { ROUTES, MESSAGES } from './utils/constants';
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
import AdminSignupFlow from './components/AdminSignupFlow';
import CreateCommunityPage from './pages/CreateCommunityPage';
import CommunityListPage from './pages/CommunityListPage';
import BrowseCommunitiesPage from './pages/BrowseCommunitiesPage';
import CommunityPage from './pages/CommunityPage';
import AdminPage from './pages/AdminPage';
import Chatbot from './components/Chatbot';
import DatabaseInitializer from './components/DatabaseInitializer';
import TailwindDemo from './pages/TailwindDemo';
import PageTransition from './components/PageTransition';
import RequestDetailModal from './components/RequestDetailModal';
import RequestOffersModal from './components/RequestOffersModal';

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
  const [selectedRequest, setSelectedRequest] = React.useState(null);
  const [offersForRequestId, setOffersForRequestId] = React.useState(null);

  // Create theme based on dark mode
  const theme = React.useMemo(
    () => {
      const base = createTheme();
      return createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          // Use slightly darker, desaturated primaries in dark mode to reduce
          // perceived brightness and glare for users.
          primary: {
            main: darkMode ? COLORS.primary[400] : COLORS.primary[600],
            light: COLORS.primary[400],
            dark: COLORS.primary[800],
            contrastText: darkMode ? '#e6e6e6' : '#ffffff',
          },
          secondary: {
            main: darkMode ? COLORS.secondary[600] : COLORS.secondary[500],
            light: COLORS.secondary[300],
            dark: COLORS.secondary[700],
            contrastText: '#ffffff',
          },
          success: { main: COLORS.success },
          error: { main: COLORS.error },
          warning: { main: COLORS.warning },
          info: { main: COLORS.info },
          background: {
            // Make backgrounds darker and reduce strong contrasts in dark mode
            default: darkMode ? '#06111a' : '#ffffff',
            paper: darkMode ? '#071824' : COLORS.neutral[50],
          },
          text: {
            // Use softer text colors in dark mode to reduce eye strain
            primary: darkMode ? COLORS.neutral[200] : COLORS.neutral[900],
            secondary: darkMode ? COLORS.neutral[400] : COLORS.neutral[600],
          },
          action: {
            hover: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
          }
        },
        typography: {
          fontFamily: TYPOGRAPHY.fontFamily.base,
          h1: { fontSize: TYPOGRAPHY.fontSize['4xl'], fontWeight: TYPOGRAPHY.fontWeight.bold },
          h2: { fontSize: TYPOGRAPHY.fontSize['3xl'], fontWeight: TYPOGRAPHY.fontWeight.bold },
          h3: { fontSize: TYPOGRAPHY.fontSize['2xl'], fontWeight: TYPOGRAPHY.fontWeight.semibold },
          h4: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.semibold },
          h5: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.semibold },
          h6: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold },
          body1: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.normal },
          body2: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.normal },
          button: { textTransform: 'none', fontWeight: TYPOGRAPHY.fontWeight.medium },
        },
        shape: { borderRadius: 10 },
        // Reduce heavy shadows in dark mode which can increase perceived brightness
        shadows: darkMode ? Array(25).fill('none') : base.shadows,
        components: {
          MuiPaper: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundColor: theme.palette.mode === 'dark' ? '#071824' : undefined,
                borderRadius: 12,
                border: theme.palette.mode === 'dark'
                  ? '1px solid rgba(255,255,255,0.06)'
                  : '1px solid rgba(0,0,0,0.06)'
              })
            }
          },
          MuiAppBar: {
            styleOverrides: {
              colorPrimary: ({ theme }) => ({
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                boxShadow: 'none',
                borderBottom: theme.palette.mode === 'dark'
                  ? '1px solid rgba(255,255,255,0.08)'
                  : '1px solid rgba(0,0,0,0.08)'
              })
            }
          },
          MuiButton: {
            defaultProps: {
              disableElevation: false
            },
            styleOverrides: {
              root: ({ theme }) => ({
                borderRadius: 10,
                fontWeight: 600
              }),
              containedSecondary: ({ theme }) => ({
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.16)
                  : alpha(theme.palette.primary.main, 0.10),
                color: theme.palette.primary.main,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.22)
                    : alpha(theme.palette.primary.main, 0.16),
                  boxShadow: 'none'
                }
              })
            }
          },
          MuiTextField: {
            defaultProps: {
              margin: 'normal',
              fullWidth: true
            }
          },
          MuiFormControl: {
            defaultProps: {
              margin: 'normal',
              fullWidth: true
            }
          }
        }
      });
    },
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

  // Keep document element class in sync so Tailwind "dark:" utilities and
  // other global dark-mode selectors work across the app (for components
  // that use Tailwind or plain CSS). This ensures the UI is actually dark
  // when the MUI theme is in dark mode.
  React.useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      // ignore in non-browser environments
    }
  }, [darkMode]);

  // Seed communities on first load - DISABLED (communities already exist)
  // React.useEffect(() => {
  //   const initializeCommunities = async () => {
  //     try {
  //       const { seedDefaultCommunities } = await import('./utils/seedCommunities');
  //       await seedDefaultCommunities();
  //     } catch (error) {
  //       console.error('Error initializing communities:', error);
  //     }
  //   };
  //   
  //   initializeCommunities();
  // }, []);

  // Initialize trust score scheduler - DISABLED (requires admin permissions)
  // React.useEffect(() => {
  //   if (communityId) {
  //     const initScheduler = async () => {
  //       try {
  //         const { initializeTrustScoreScheduler, updateOutdatedTrustScores } = await import('./utils/trustScoreScheduler');
  //         
  //         // Update outdated scores on app load
  //         await updateOutdatedTrustScores(communityId);
  //         
  //         // Initialize daily scheduler
  //         initializeTrustScoreScheduler(communityId);
  //         
  //         console.log('Trust score scheduler initialized');
  //       } catch (error) {
  //         console.error('Error initializing trust score scheduler:', error);
  //       }
  //     };
  //     
  //     initScheduler();
  //   }
  // }, [communityId]);

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
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req => {
        const title = (req.title || '').toLowerCase();
        const desc = (req.description || '').toLowerCase();
        const loc = (typeof req.location === 'string' 
          ? (req.location || '') 
          : (req.location?.address || '')).toLowerCase();
        return title.includes(term) || desc.includes(term) || loc.includes(term);
      });
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

  // Owner-approval model: Volunteers submit an offer instead of instant claim
  const handleVolunteer = async (requestId) => {
    if (!user) return;

    try {
      const request = requests.find(req => req.id === requestId);

      if (!request) return;

      if (request?.status !== 'open') {
        showNotification('Offers are closed for this request', 'warning');
        return;
      }

      if (request?.createdByUid === user.uid) {
        showNotification('You cannot offer to your own request', 'warning');
        return;
      }

      // Prevent duplicate pending offer from the same user
      const existingSnap = await getDocs(query(collection(db, 'requests', requestId, 'offers'), where('userId', '==', user.uid), where('status', '==', 'pending')));
      if (!existingSnap.empty) {
        showNotification('You already sent an offer for this request', 'info');
        return;
      }

      await addDoc(collection(db, 'requests', requestId, 'offers'), {
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      // Notify the request owner
      await addDoc(collection(db, 'notifications'), {
        userId: request.createdByUid,
        type: 'new_offer',
        title: 'New offer received',
        message: `${user.email} offered help on "${request.title}"`,
        createdAt: serverTimestamp(),
        read: false,
        requestId: requestId
      });

      showNotification('Offer sent to the requester');
    } catch (error) {
      console.error('Error sending offer:', error);
      showNotification('Failed to send offer', 'error');
    }
  };

  const handleReviewOffers = (requestId) => {
    setOffersForRequestId(requestId);
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
      // Notify the owner to verify completion
      const request = requests.find(req => req.id === requestId);
      if (request?.createdByUid) {
        await addDoc(collection(db, 'notifications'), {
          userId: request.createdByUid,
          type: 'verify_completion',
          title: 'Verify completion requested',
          message: `${user.email} marked "${request.title}" as complete. Please verify.`,
          createdAt: serverTimestamp(),
          read: false,
          requestId
        });
      }
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

        // Notify the volunteer that completion was verified
        if (request?.claimedByUid) {
          await addDoc(collection(db, 'notifications'), {
            userId: request.claimedByUid,
            type: 'request_completed',
            title: 'Completion verified',
            message: `Your help on "${request.title}" was verified as completed.`,
            createdAt: serverTimestamp(),
            read: false,
            requestId
          });
        }

        if (request?.claimedByUid) {
          try {
            const claimTime = request.claimedAt?.toMillis ? request.claimedAt.toMillis() : Date.now();
            const completionTime = Date.now() - claimTime;
            const reward = await awardPointsForCompletion(request.claimedByUid, request, completionTime);

            if (reward.newAchievements && reward.newAchievements.length > 0) {
              const achievementNames = reward.newAchievements.map(a => a.name).join(', ');
              showNotification(`🎉 New Achievement${reward.newAchievements.length > 1 ? 's' : ''}: ${achievementNames}!`, 'success');
            }
            if (reward.leveledUp) {
              showNotification(`🎊 Level Up! You're now a ${reward.newLevel.name} ${reward.newLevel.badge}!`, 'success');
            }
          } catch (gamificationError) {
            console.error('Error awarding points:', gamificationError);
          }
        }

        showNotification('Request verified as completed! You can now rate the volunteer.');
      } else {
        await updateDoc(requestRef, {
          status: 'claimed',
          history: arrayUnion({
            type: 'completion_rejected',
            byUid: user.uid,
            by: user.email,
            at: new Date().toISOString()
          })
        });
        // Notify the volunteer that completion was rejected
        if (request?.claimedByUid) {
          await addDoc(collection(db, 'notifications'), {
            userId: request.claimedByUid,
            type: 'completion_rejected',
            title: 'Completion not approved',
            message: `Your completion for "${request.title}" was not approved. Please follow up in chat.`,
            createdAt: serverTimestamp(),
            read: false,
            requestId
          });
        }
        showNotification('Completion rejected. Request reopened.');
      }
    } catch (error) {
      console.error('Error verifying completion:', error);
      showNotification('Error verifying completion. Please try again.', 'error');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="sticky" color="primary" elevation={0} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
            <Toolbar>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Link to={ROUTES.HOME} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                      Assistly
                    </Typography>
                  </Link>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton color="inherit" onClick={toggleDarkMode} sx={{ mr: 1 }}>
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                  {user ? (
                    <>
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

                      {!userProfile?.role || userProfile?.role === 'user' || userProfile?.role === 'moderator' ? (
                        <Button color="inherit" component={Link} to="/browse-communities" sx={{ fontSize: '0.85rem' }}>
                          Find Communities
                        </Button>
                      ) : null}

                      {userProfile?.role && (userProfile.role === 'super_admin' || userProfile.role === 'community_admin' || userProfile.role === 'moderator') && (
                        <Button
                          color="inherit"
                          component={Link}
                          to="/admin"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            fontWeight: 700,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                          }}
                        >
                          👑 Admin
                        </Button>
                      )}

                      <ToggleButtonGroup
                        value={currentMode}
                        exclusive
                        onChange={handleModeChange}
                        size="small"
                        sx={(theme) => ({
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : alpha(theme.palette.primary.main, 0.08),
                          borderRadius: 2,
                          backdropFilter: 'blur(10px)',
                          border: theme.palette.mode === 'dark'
                            ? '1px solid rgba(255,255,255,0.2)'
                            : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          '& .MuiToggleButton-root': {
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.85)' : theme.palette.primary.main,
                            border: 'none',
                            px: 2.5,
                            py: 0.75,
                            fontWeight: 600,
                            transition: 'all 0.3s ease',
                            '&.Mui-selected': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.95)' : theme.palette.primary.main,
                              color: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.contrastText,
                              '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,1)' : theme.palette.primary.dark },
                            },
                            '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : alpha(theme.palette.primary.main, 0.16) },
                          },
                        })}
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

                      <Typography variant="body1">
                        {user.displayName || user.email.split('@')[0]}
                      </Typography>
                      <Button color="inherit" onClick={handleLogout}>
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button color="inherit" component={Link} to={ROUTES.LOGIN}>
                        Login
                      </Button>
                      <Button color="inherit" component={Link} to={ROUTES.SIGNUP}>
                        Sign Up
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </Toolbar>
          </AppBar>

          <Routes>
            <Route path="/tw-demo" element={<TailwindDemo />} />
            <Route path={ROUTES.LOGIN} element={<PageTransition type="fade" timeout={300}><Login /></PageTransition>} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-signup" element={<AdminSignupFlow />} />
            <Route path={ROUTES.SIGNUP} element={<PageTransition type="fade" timeout={300}><SignUp /></PageTransition>} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route path={ROUTES.TERMS} element={<TermsOfService />} />
            <Route path={ROUTES.PRIVACY} element={<PrivacyPolicy />} />
            <Route path="/profile" element={<ProtectedRoute><PageTransition type="fade" timeout={300}><UserProfile /></PageTransition></ProtectedRoute>} />
            <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><PageTransition type="fade" timeout={300}><Dashboard /></PageTransition></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><CommunityAdminDashboard /></ProtectedRoute>} />
            <Route path="/communities" element={<ProtectedRoute><CommunityListPage /></ProtectedRoute>} />
            <Route path="/browse-communities" element={<ProtectedRoute><BrowseCommunitiesPage /></ProtectedRoute>} />
            <Route path="/create-community" element={<ProtectedRoute><CreateCommunityPage /></ProtectedRoute>} />
            <Route path="/community/:communityId" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
            <Route path="/admin/:communityId" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route
              path={ROUTES.HOME}
              element={
                <ProtectedRoute>
                  <PageTransition type="fade" timeout={350}>
                    <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
                      {/* Hero Panel - Neutral surface with subtle brand accent */}
                      <Box sx={(theme) => ({
                        mb: 4,
                        p: 3,
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        borderRadius: 3,
                        boxShadow: 1,
                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '220px',
                          height: '220px',
                          background: alpha(theme.palette.primary.main, 0.08),
                          borderRadius: '50%',
                          transform: 'translate(50%, -50%)'
                        }
                      })}>
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
                            {currentMode === 'volunteer' ? 'Browse and accept requests to help community members' : 'Post your requests and get help from volunteers'}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        {currentMode === 'resident' && (
                          <Button
                            variant="contained"
                            onClick={() => setShowModal(true)}
                            sx={{
                              px: 3,
                              py: 1.5,
                              borderRadius: 2,
                              fontWeight: 600,
                              fontSize: '1rem',
                              textTransform: 'none',
                              boxShadow: 2,
                              transition: 'transform 0.25s ease',
                              '&:hover': { transform: 'translateY(-2px)' },
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

                      <AdvancedSearch onSearch={handleAdvancedSearch} onClear={handleClearFilters} />

                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <ToggleButtonGroup
                          value={viewMode}
                          exclusive
                          onChange={(e, newMode) => newMode && setViewMode(newMode)}
                          sx={{ backgroundColor: 'background.paper', boxShadow: 1 }}
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
                        <RequestModal onClose={() => setShowModal(false)} />
                      )}

                      {viewMode === 'map' ? (
                        <MapView requests={filteredRequests} onRequestClick={(request) => setSelectedRequest(request)} />
                      ) : (
                        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                          {loading ? (
                            <LoadingSpinner />
                          ) : filteredRequests.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8, gridColumn: '1 / -1' }}>
                              <Typography variant="h6" color="text.secondary" gutterBottom>
                                No requests found
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {searchTerm || activeFiltersCount > 0 ? 'Try adjusting your search or filters' : 'Be the first to create a request!'}
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
                              onReviewOffers={handleReviewOffers}
                            />
                          ))}
                        </Box>
                      )}
                    </Container>
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to={ROUTES.HOME} />} />
          </Routes>

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

          {selectedRequest && (
            <RequestDetailModal
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
            />
          )}

          {offersForRequestId && (
            <RequestOffersModal
              requestId={offersForRequestId}
              onClose={() => setOffersForRequestId(null)}
            />
          )}

          {user && <Chatbot />}

          <DatabaseInitializer open={showDbInitializer} onClose={() => setShowDbInitializer(false)} />
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
