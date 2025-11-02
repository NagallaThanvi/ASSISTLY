import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';

/**
 * Delete all users from Firestore
 * WARNING: This is a destructive operation!
 */
export const deleteAllUsers = async () => {
  try {
    console.log('Starting user cleanup...');
    
    const usersRef = collection(db, COLLECTIONS.USERS);
    const snapshot = await getDocs(usersRef);
    
    console.log(`Found ${snapshot.size} users to delete`);
    
    const deletePromises = snapshot.docs.map(async (userDoc) => {
      console.log(`Deleting user: ${userDoc.id} (${userDoc.data().email})`);
      await deleteDoc(doc(db, COLLECTIONS.USERS, userDoc.id));
    });
    
    await Promise.all(deletePromises);
    
    console.log('✅ All users deleted successfully!');
    return {
      success: true,
      deletedCount: snapshot.size
    };
  } catch (error) {
    console.error('Error deleting users:', error);
    throw error;
  }
};

/**
 * Delete all join requests
 */
export const deleteAllJoinRequests = async () => {
  try {
    console.log('Starting join requests cleanup...');
    
    const requestsRef = collection(db, 'join_requests');
    const snapshot = await getDocs(requestsRef);
    
    console.log(`Found ${snapshot.size} join requests to delete`);
    
    const deletePromises = snapshot.docs.map(async (requestDoc) => {
      await deleteDoc(doc(db, 'join_requests', requestDoc.id));
    });
    
    await Promise.all(deletePromises);
    
    console.log('✅ All join requests deleted successfully!');
    return {
      success: true,
      deletedCount: snapshot.size
    };
  } catch (error) {
    console.error('Error deleting join requests:', error);
    throw error;
  }
};

/**
 * Reset community member counts to 0
 */
export const resetCommunityMemberCounts = async () => {
  try {
    console.log('Resetting community member counts...');
    
    const communitiesRef = collection(db, COLLECTIONS.COMMUNITIES);
    const snapshot = await getDocs(communitiesRef);
    
    const updatePromises = snapshot.docs.map(async (communityDoc) => {
      const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityDoc.id);
      await updateDoc(communityRef, {
        memberCount: 0
      });
    });
    
    await Promise.all(updatePromises);
    
    console.log('✅ Community member counts reset!');
    return {
      success: true,
      updatedCount: snapshot.size
    };
  } catch (error) {
    console.error('Error resetting member counts:', error);
    throw error;
  }
};

/**
 * Complete cleanup - removes all users and related data
 */
export const completeUserCleanup = async () => {
  try {
    console.log('🧹 Starting complete user cleanup...');
    console.log('⚠️  This will delete all users, join requests, and reset member counts');
    
    // Delete all users
    const usersResult = await deleteAllUsers();
    console.log(`✅ Deleted ${usersResult.deletedCount} users`);
    
    // Delete all join requests
    const requestsResult = await deleteAllJoinRequests();
    console.log(`✅ Deleted ${requestsResult.deletedCount} join requests`);
    
    // Reset community member counts
    await resetCommunityMemberCounts();
    
    console.log('🎉 Complete cleanup finished!');
    
    return {
      success: true,
      usersDeleted: usersResult.deletedCount,
      requestsDeleted: requestsResult.deletedCount
    };
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
};

// Note: Firebase Authentication users need to be deleted separately
// from the Firebase Console or using Admin SDK
console.warn(`
⚠️  IMPORTANT: This script only deletes Firestore user documents.
To delete Firebase Authentication users:
1. Go to Firebase Console
2. Navigate to Authentication → Users
3. Select all users and delete them
OR use Firebase Admin SDK with deleteUser() function
`);
