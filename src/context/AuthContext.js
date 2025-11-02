import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [communityId, setCommunityId] = useState(null); // Keep for backward compatibility
  const [communities, setCommunities] = useState({}); // New: map of communityId -> role
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Load user profile and community info
        try {
          const userRef = doc(db, COLLECTIONS.USERS, user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
            
            // Support both old and new models
            if (userData.communities) {
              // New multi-community model
              setCommunities(userData.communities);
              // Set first community as default for backward compatibility
              const firstCommunityId = Object.keys(userData.communities)[0];
              setCommunityId(firstCommunityId || null);
            } else if (userData.communityId) {
              // Old single-community model
              setCommunityId(userData.communityId);
              setCommunities({ [userData.communityId]: 'member' });
            } else {
              setCommunityId(null);
              setCommunities({});
            }
          } else {
            setUserProfile(null);
            setCommunityId(null);
            setCommunities({});
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUserProfile(null);
          setCommunityId(null);
          setCommunities({});
        }
      } else {
        setUserProfile(null);
        setCommunityId(null);
        setCommunities({});
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshUserProfile = async () => {
    if (user) {
      try {
        const userRef = doc(db, COLLECTIONS.USERS, user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile(userData);
          
          // Support both old and new models
          if (userData.communities) {
            setCommunities(userData.communities);
            const firstCommunityId = Object.keys(userData.communities)[0];
            setCommunityId(firstCommunityId || null);
          } else if (userData.communityId) {
            setCommunityId(userData.communityId);
            setCommunities({ [userData.communityId]: 'member' });
          } else {
            setCommunityId(null);
            setCommunities({});
          }
        }
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  const value = {
    user,
    userProfile,
    communityId, // Keep for backward compatibility
    communities, // New: map of all communities user belongs to
    loading,
    refreshUserProfile,
    // Helper functions
    isAdmin: (commId) => communities[commId] === 'admin',
    isMember: (commId) => communities[commId] === 'member' || communities[commId] === 'admin',
    getUserCommunities: () => Object.keys(communities)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};