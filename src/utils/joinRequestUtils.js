import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';
import { logAdminAction } from './adminUtils';

// Join Request Status
export const JOIN_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

/**
 * Create a community join request
 */
export const createJoinRequest = async (userId, communityId, userEmail, userName, message = '', verificationData = null) => {
  try {
    const requestRef = doc(collection(db, 'join_requests'));
    
    const requestData = {
      userId,
      userEmail,
      userName,
      communityId,
      message,
      status: JOIN_REQUEST_STATUS.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add verification data if provided
    if (verificationData) {
      requestData.verification = {
        address: verificationData.address,
        zipCode: verificationData.zipCode,
        residencyProof: verificationData.residencyProof,
        verified: false // Admin will verify this
      };
    }
    
    await setDoc(requestRef, requestData);

    return requestRef.id;
  } catch (error) {
    console.error('Error creating join request:', error);
    throw error;
  }
};

/**
 * Get all pending join requests for a community
 */
export const getPendingJoinRequests = async (communityId) => {
  try {
    const requestsQuery = query(
      collection(db, 'join_requests'),
      where('communityId', '==', communityId),
      where('status', '==', JOIN_REQUEST_STATUS.PENDING)
    );
    
    const snapshot = await getDocs(requestsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching join requests:', error);
    throw error;
  }
};

/**
 * Get all join requests for a community (all statuses)
 */
export const getAllJoinRequests = async (communityId) => {
  try {
    const requestsQuery = query(
      collection(db, 'join_requests'),
      where('communityId', '==', communityId)
    );
    
    const snapshot = await getDocs(requestsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching all join requests:', error);
    throw error;
  }
};

/**
 * Get user's join request status for a community
 */
export const getUserJoinRequest = async (userId, communityId) => {
  try {
    const requestsQuery = query(
      collection(db, 'join_requests'),
      where('userId', '==', userId),
      where('communityId', '==', communityId)
    );
    
    const snapshot = await getDocs(requestsQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };
  } catch (error) {
    console.error('Error fetching user join request:', error);
    throw error;
  }
};

/**
 * Approve a join request
 */
export const approveJoinRequest = async (requestId, adminId) => {
  try {
    const requestRef = doc(db, 'membershipRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Join request not found');
    }
    
    const requestData = requestDoc.data();
    
    // Update user's community - NEW STRUCTURE
    const userRef = doc(db, COLLECTIONS.USERS, requestData.userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    const communities = userData.communities || {};
    
    // Add community with member role
    communities[requestData.communityId] = 'member';
    
    await updateDoc(userRef, {
      communities: communities,
      communityId: requestData.communityId, // Set as default
      joinedCommunityAt: serverTimestamp(),
      onboardingCompleted: true,
      updatedAt: serverTimestamp()
    });
    
    // Update join request status
    await updateDoc(requestRef, {
      status: 'approved',
      approvedBy: adminId,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Increment community member count
    const communityRef = doc(db, COLLECTIONS.COMMUNITIES, requestData.communityId);
    const communityDoc = await getDoc(communityRef);
    if (communityDoc.exists()) {
      const currentCount = communityDoc.data().memberCount || 0;
      await updateDoc(communityRef, {
        memberCount: currentCount + 1,
        updatedAt: serverTimestamp()
      });
    }
    
    // Log admin action
    await logAdminAction({
      action: 'JOIN_REQUEST_APPROVED',
      requestId: requestId,
      userId: requestData.userId,
      communityId: requestData.communityId,
      performedBy: adminId
    });
    
    return true;
  } catch (error) {
    console.error('Error approving join request:', error);
    throw error;
  }
};

/**
 * Reject a join request
 */
export const rejectJoinRequest = async (requestId, adminId, reason = '') => {
  try {
    const requestRef = doc(db, 'join_requests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Join request not found');
    }
    
    const requestData = requestDoc.data();
    
    // Update join request status
    await updateDoc(requestRef, {
      status: JOIN_REQUEST_STATUS.REJECTED,
      rejectedBy: adminId,
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
      updatedAt: serverTimestamp()
    });
    
    // Log admin action
    await logAdminAction({
      action: 'JOIN_REQUEST_REJECTED',
      requestId: requestId,
      userId: requestData.userId,
      communityId: requestData.communityId,
      performedBy: adminId,
      reason: reason
    });
    
    return true;
  } catch (error) {
    console.error('Error rejecting join request:', error);
    throw error;
  }
};

/**
 * Cancel a join request (by user)
 */
export const cancelJoinRequest = async (requestId, userId) => {
  try {
    const requestRef = doc(db, 'join_requests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Join request not found');
    }
    
    const requestData = requestDoc.data();
    
    // Verify user owns this request
    if (requestData.userId !== userId) {
      throw new Error('Unauthorized to cancel this request');
    }
    
    // Delete the request
    await deleteDoc(requestRef);
    
    return true;
  } catch (error) {
    console.error('Error canceling join request:', error);
    throw error;
  }
};

/**
 * Get pending requests count for a community
 */
export const getPendingRequestsCount = async (communityId) => {
  try {
    const requests = await getPendingJoinRequests(communityId);
    return requests.length;
  } catch (error) {
    console.error('Error getting pending requests count:', error);
    return 0;
  }
};
