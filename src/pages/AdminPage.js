import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ArrowBack as BackIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminPage() {
  const { communityId } = useParams();
  const [community, setCommunity] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommunity = async () => {
      const communityRef = doc(db, 'communities', communityId);
      const docSnap = await getDoc(communityRef);
      if (docSnap.exists()) {
        setCommunity({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };

    fetchCommunity();
  }, [communityId]);

  useEffect(() => {
    if (!communityId) return;

    const q = query(
      collection(db, 'membershipRequests'),
      where('communityId', '==', communityId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingRequests(requestsData);
    });

    return () => unsubscribe();
  }, [communityId]);

  useEffect(() => {
    if (!communityId) return;

    const fetchMembers = async () => {
      try {
        // Fetch all users and filter client-side
        // (Firestore doesn't support complex queries on map fields)
        const usersQuery = collection(db, 'users');
        const snapshot = await getDocs(usersQuery);
        
        const membersData = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              role: data.communities?.[communityId]
            };
          })
          .filter(user => user.role === 'admin' || user.role === 'member');
        
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    fetchMembers();
  }, [communityId, pendingRequests]);

  const handleApprove = async (requestId, userId) => {
    try {
      const requestRef = doc(db, 'membershipRequests', requestId);
      await updateDoc(requestRef, {
        status: 'approved'
      });
      setSuccessMessage('Member approved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      const requestRef = doc(db, 'membershipRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected'
      });
      setSuccessMessage('Request rejected');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(`/community/${communityId}`)} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <AdminIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight="700">
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {community?.name || 'Community'}
          </Typography>
        </Box>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Paper elevation={3}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={`Pending Requests (${pendingRequests.length})`} 
            icon={<PersonIcon />}
            iconPosition="start"
          />
          <Tab 
            label={`Members (${members.length})`}
            icon={<AdminIcon />}
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <>
              {pendingRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No pending membership requests
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>User Email</strong></TableCell>
                        <TableCell><strong>User ID</strong></TableCell>
                        <TableCell><strong>Requested</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingRequests.map(request => (
                        <TableRow key={request.id} hover>
                          <TableCell>{request.userEmail || 'N/A'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {request.userId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {request.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Approve">
                              <IconButton 
                                color="success" 
                                onClick={() => handleApprove(request.id, request.userId)}
                                size="small"
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton 
                                color="error" 
                                onClick={() => handleReject(request.id)}
                                size="small"
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {tabValue === 1 && (
            <>
              {members.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No members yet
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell><strong>Role</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {members.map(member => (
                        <TableRow key={member.id} hover>
                          <TableCell>{member.displayName || 'N/A'}</TableCell>
                          <TableCell>{member.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={member.role} 
                              size="small"
                              color={member.role === 'admin' ? 'primary' : 'default'}
                              icon={member.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
