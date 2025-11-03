import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
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

  // Helper function to update profile state
  const updateProfileState = (userData) => {
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
  };

  useEffect(() => {
    let profileUnsubscribe = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Set up real-time listener for user profile changes
        const userRef = doc(db, COLLECTIONS.USERS, user.uid);
        
        profileUnsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            updateProfileState(userData);
          } else {
            setUserProfile(null);
            setCommunityId(null);
            setCommunities({});
          }
          setLoading(false);
        }, (error) => {
          console.error('Error listening to user profile:', error);
          setUserProfile(null);
          setCommunityId(null);
          setCommunities({});
          setLoading(false);
        });
      } else {
        // Clean up profile listener if user logs out
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }
        setUserProfile(null);
        setCommunityId(null);
        setCommunities({});
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  const refreshUserProfile = async () => {
    if (user) {
      try {
        const userRef = doc(db, COLLECTIONS.USERS, user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          updateProfileState(userData);
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