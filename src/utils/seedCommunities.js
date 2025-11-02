import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';
import { DEFAULT_COMMUNITIES } from './communityUtils';

/**
 * Seeds the database with default communities if none exist
 */
export const seedDefaultCommunities = async () => {
  try {
    // Check if communities already exist
    const communitiesRef = collection(db, COLLECTIONS.COMMUNITIES);
    const snapshot = await getDocs(communitiesRef);
    
    if (snapshot.empty) {
      console.log('No communities found. Seeding default communities...');
      
      // Add each default community
      for (const community of DEFAULT_COMMUNITIES) {
        const communityRef = doc(db, COLLECTIONS.COMMUNITIES, community.id);
        await setDoc(communityRef, {
          name: community.name,
          description: community.description,
          location: community.location,
          active: community.active,
          memberCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created community: ${community.name}`);
      }
      
      console.log('Default communities seeded successfully!');
      return true;
    } else {
      console.log(`Found ${snapshot.size} existing communities. Skipping seed.`);
      return false;
    }
  } catch (error) {
    console.error('Error seeding communities:', error);
    throw error;
  }
};

/**
 * Manually add a new community
 */
export const addCommunity = async (communityData) => {
  try {
    const communityRef = doc(collection(db, COLLECTIONS.COMMUNITIES));
    await setDoc(communityRef, {
      ...communityData,
      memberCount: 0,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Community added successfully:', communityData.name);
    return communityRef.id;
  } catch (error) {
    console.error('Error adding community:', error);
    throw error;
  }
};
