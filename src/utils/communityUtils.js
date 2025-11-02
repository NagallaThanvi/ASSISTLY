import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';

/**
 * Get all available communities
 */
export const getAllCommunities = async () => {
  try {
    const communitiesRef = collection(db, COLLECTIONS.COMMUNITIES);
    const snapshot = await getDocs(communitiesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching communities:', error);
    throw error;
  }
};

/**
 * Get a specific community by ID
 */
export const getCommunityById = async (communityId) => {
  try {
    const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId);
    const communityDoc = await getDoc(communityRef);
    
    if (communityDoc.exists()) {
      return {
        id: communityDoc.id,
        ...communityDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching community:', error);
    throw error;
  }
};

/**
 * Create a new community
 */
export const createCommunity = async (communityData) => {
  try {
    const communityRef = doc(collection(db, COLLECTIONS.COMMUNITIES));
    await setDoc(communityRef, {
      ...communityData,
      createdAt: new Date(),
      memberCount: 0,
      active: true
    });
    return communityRef.id;
  } catch (error) {
    console.error('Error creating community:', error);
    throw error;
  }
};

/**
 * Get user's community
 */
export const getUserCommunity = async (userId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().communityId) {
      return await getCommunityById(userDoc.data().communityId);
    }
    return null;
  } catch (error) {
    console.error('Error fetching user community:', error);
    throw error;
  }
};

/**
 * Assign user to a community
 */
export const assignUserToCommunity = async (userId, communityId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(userRef, {
      communityId: communityId,
      joinedCommunityAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error assigning user to community:', error);
    throw error;
  }
};

/**
 * Get all members of a community
 */
export const getCommunityMembers = async (communityId) => {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('communityId', '==', communityId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching community members:', error);
    throw error;
  }
};

/**
 * Check if user belongs to a community
 */
export const userBelongsToCommunity = async (userId, communityId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().communityId === communityId;
    }
    return false;
  } catch (error) {
    console.error('Error checking user community:', error);
    return false;
  }
};

// Default communities that can be seeded
export const DEFAULT_COMMUNITIES = [
  {
    id: 'community-downtown',
    name: 'Downtown Community',
    description: 'Serving the downtown area and surrounding neighborhoods',
    location: 'Downtown',
    active: true
  },
  {
    id: 'community-suburbs',
    name: 'Suburban Community',
    description: 'Connecting suburban residents and volunteers',
    location: 'Suburbs',
    active: true
  },
  {
    id: 'community-riverside',
    name: 'Riverside Community',
    description: 'Supporting the riverside district',
    location: 'Riverside',
    active: true
  }
];
