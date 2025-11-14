import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { db } from '../firebase';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  arrayUnion,
  addDoc
} from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const RequestOffersModal = ({ requestId, onClose }) => {
  const { showNotification } = useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    if (!requestId) return;
    const q = query(
      collection(db, 'requests', requestId, 'offers'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [requestId]);

  const pendingOffers = useMemo(() => offers.filter(o => o.status === 'pending'), [offers]);

  const approveOffer = async (offer) => {
    if (!user) return;
    setSaving(true);
    try {
      // Fetch latest request
      const requestRef = doc(db, 'requests', requestId);
      const reqSnap = await getDoc(requestRef);
      if (!reqSnap.exists()) {
        showNotification('Request not found', 'error');
        return;
      }
      const request = reqSnap.data();

      if (request.status !== 'open') {
        showNotification('Cannot assign. Request is no longer open.', 'warning');
        return;
      }
      if (request.createdByUid !== user.uid) {
        showNotification('Only the requester can assign a volunteer', 'error');
        return;
      }

      // Assign volunteer
      await updateDoc(requestRef, {
        status: 'claimed',
        claimedByUid: offer.userId,
        claimedBy: offer.userEmail,
        claimedAt: serverTimestamp(),
        history: arrayUnion({
          type: 'assigned',
          byUid: user.uid,
          by: user.email,
          toUid: offer.userId,
          to: offer.userEmail,
          at: new Date().toISOString()
        })
      });

      // Mark selected offer accepted
      const offerRef = doc(db, 'requests', requestId, 'offers', offer.id);
      await updateDoc(offerRef, { status: 'accepted' });

      // Decline other pending offers
      const allOffersSnap = await getDocs(collection(db, 'requests', requestId, 'offers'));
      const otherOffers = allOffersSnap.docs.filter(d => d.id !== offer.id && d.data().status === 'pending');
      await Promise.all(otherOffers.map(d => updateDoc(d.ref, { status: 'declined' })));

      // Notifications
      // Notify the approved volunteer
      await addDoc(collection(db, 'notifications'), {
        userId: offer.userId,
        type: 'offer_accepted',
        title: 'Your offer was accepted',
        message: `You have been assigned to: "${request.title}"`,
        createdAt: serverTimestamp(),
        read: false,
        requestId
      });

      // Notify declined volunteers
      await Promise.all(otherOffers.map(d => addDoc(collection(db, 'notifications'), {
        userId: d.data().userId,
        type: 'offer_declined',
        title: 'Offer declined',
        message: `Your offer for "${request.title}" was not selected`,
        createdAt: serverTimestamp(),
        read: false,
        requestId
      })));

      // Notify owner that request is now claimed
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        type: 'request_claimed',
        title: 'Volunteer assigned',
        message: `${offer.userEmail} has been assigned to "${request.title}"`,
        createdAt: serverTimestamp(),
        read: false,
        requestId
      });

      showNotification('Volunteer assigned successfully');
      onClose?.();
    } catch (err) {
      console.error('Error approving offer:', err);
      showNotification('Failed to assign volunteer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const declineOffer = async (offer) => {
    if (!user) return;
    setSaving(true);
    try {
      const offerRef = doc(db, 'requests', requestId, 'offers', offer.id);
      await updateDoc(offerRef, { status: 'declined' });
      showNotification('Offer declined');
    } catch (err) {
      console.error('Error declining offer:', err);
      showNotification('Failed to decline offer', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!requestId} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Review Offers</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : pendingOffers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No pending offers.
          </Typography>
        ) : (
          <List>
            {pendingOffers.map((offer) => (
              <ListItem key={offer.id} divider>
                <ListItemText
                  primary={offer.userEmail}
                  secondary={`Offered on ${offer.createdAt?.toDate ? offer.createdAt.toDate().toLocaleString() : ''}`}
                />
                <Chip label={offer.status} size="small" sx={{ mr: 2 }} />
                <ListItemSecondaryAction>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => approveOffer(offer)}
                    disabled={saving}
                    sx={{ mr: 1 }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => declineOffer(offer)}
                    disabled={saving}
                  >
                    Decline
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestOffersModal;
