/**
 * Database Migration & Structure Fix
 * Fixes admin-user-community linking issues
 */

import { collection, getDocs, doc, updateDoc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';

/**
 * Migrate all users to new structure
 * Adds role field and converts communityId to communities map
 */
export async function migrateDatabaseStructure() {
  console.log('🔄 Starting database migration...');
  
  try {
    const batch = writeBatch(db);
    let updateCount = 0;
    
    // 1. Migrate Users
    console.log('📝 Migrating users...');
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const updates = {};
      
      // Add role if missing
      if (!userData.role) {
        updates.role = 'user'; // Default role
      }
      
      // Convert old communityId to new communities map
      if (userData.communityId && !userData.communities) {
        updates.communities = {
          [userData.communityId]: 'member'
        };
      }
      
      // Add default fields if missing
      if (!userData.points) updates.points = 0;
      if (!userData.level) updates.level = 1;
      if (!userData.achievements) updates.achievements = [];
      if (!userData.trustScore) updates.trustScore = 75;
      if (!userData.streak) updates.streak = 0;
      
      // Update if there are changes
      if (Object.keys(updates).length > 0) {
        const userRef = doc(db, COLLECTIONS.USERS, userDoc.id);
        batch.update(userRef, {
          ...updates,
          updatedAt: new Date()
        });
        updateCount++;
      }
    }
    
    // 2. Migrate Communities
    console.log('📝 Migrating communities...');
    const communitiesSnapshot = await getDocs(collection(db, COLLECTIONS.COMMUNITIES));
    
    for (const communityDoc of communitiesSnapshot.docs) {
      const communityData = communityDoc.data();
      const updates = {};
      
      // Add default fields if missing
      if (communityData.memberCount === undefined) updates.memberCount = 0;
      if (communityData.active === undefined) updates.active = true;
      
      // Update if there are changes
      if (Object.keys(updates).length > 0) {
        const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityDoc.id);
        batch.update(communityRef, {
          ...updates,
          updatedAt: new Date()
        });
        updateCount++;
      }
    }
    
    // Commit batch
    await batch.commit();
    
    console.log(`✅ Migration complete! Updated ${updateCount} documents.`);
    return { success: true, updatedCount: updateCount };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Create or update a super admin user
 */
export async function createSuperAdmin(email, userId = null) {
  try {
    console.log(`🔐 Creating super admin for: ${email}`);
    
    // Find user by email
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    let targetUserId = userId;
    
    if (!targetUserId) {
      const userDoc = usersSnapshot.docs.find(doc => doc.data().email === email);
      if (!userDoc) {
        throw new Error(`User with email ${email} not found. Please register first.`);
      }
      targetUserId = userDoc.id;
    }
    
    // Update user to super admin
    const userRef = doc(db, COLLECTIONS.USERS, targetUserId);
    await updateDoc(userRef, {
      role: 'super_admin',
      updatedAt: new Date()
    });
    
    console.log(`✅ Super admin created: ${email}`);
    return { success: true, userId: targetUserId };
    
  } catch (error) {
    console.error('❌ Failed to create super admin:', error);
    throw error;
  }
}

/**
 * Fix community admin assignments
 * Ensures community creators are marked as admins
 */
export async function fixCommunityAdmins() {
  try {
    console.log('🔧 Fixing community admin assignments...');
    
    const communitiesSnapshot = await getDocs(collection(db, COLLECTIONS.COMMUNITIES));
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    
    let fixCount = 0;
    
    for (const communityDoc of communitiesSnapshot.docs) {
      const communityData = communityDoc.data();
      const communityId = communityDoc.id;
      const adminUid = communityData.admin;
      
      if (!adminUid) continue;
      
      // Find admin user
      const adminUserDoc = usersSnapshot.docs.find(doc => doc.id === adminUid);
      if (!adminUserDoc) continue;
      
      const adminData = adminUserDoc.data();
      
      // Check if user has admin role for this community
      if (!adminData.communities || adminData.communities[communityId] !== 'admin') {
        const userRef = doc(db, COLLECTIONS.USERS, adminUid);
        await updateDoc(userRef, {
          [`communities.${communityId}`]: 'admin',
          updatedAt: new Date()
        });
        fixCount++;
        console.log(`✅ Fixed admin for community: ${communityData.name}`);
      }
    }
    
    console.log(`✅ Fixed ${fixCount} community admin assignments.`);
    return { success: true, fixedCount: fixCount };
    
  } catch (error) {
    console.error('❌ Failed to fix community admins:', error);
    throw error;
  }
}

/**
 * Verify database structure is correct
 */
export async function verifyDatabaseStructure() {
  console.log('🔍 Verifying database structure...');
  
  const issues = [];
  
  try {
    // Check Users
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    console.log(`📊 Found ${usersSnapshot.size} users`);
    
    let usersWithoutRole = 0;
    let usersWithoutCommunities = 0;
    let superAdmins = 0;
    let communityAdmins = 0;
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!data.role) usersWithoutRole++;
      if (!data.communities) usersWithoutCommunities++;
      if (data.role === 'super_admin') superAdmins++;
      if (data.role === 'community_admin') communityAdmins++;
    });
    
    if (usersWithoutRole > 0) {
      issues.push(`⚠️ ${usersWithoutRole} users missing role field`);
    }
    if (usersWithoutCommunities > 0) {
      issues.push(`⚠️ ${usersWithoutCommunities} users missing communities field`);
    }
    if (superAdmins === 0) {
      issues.push(`⚠️ No super admin users found`);
    }
    
    console.log(`✅ Super Admins: ${superAdmins}`);
    console.log(`✅ Community Admins: ${communityAdmins}`);
    console.log(`✅ Regular Users: ${usersSnapshot.size - superAdmins - communityAdmins}`);
    
    // Check Communities
    const communitiesSnapshot = await getDocs(collection(db, COLLECTIONS.COMMUNITIES));
    console.log(`📊 Found ${communitiesSnapshot.size} communities`);
    
    let communitiesWithoutAdmin = 0;
    
    communitiesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!data.admin) communitiesWithoutAdmin++;
    });
    
    if (communitiesWithoutAdmin > 0) {
      issues.push(`⚠️ ${communitiesWithoutAdmin} communities missing admin field`);
    }
    
    // Summary
    if (issues.length === 0) {
      console.log('✅ Database structure is correct!');
      return { success: true, issues: [] };
    } else {
      console.log('⚠️ Issues found:');
      issues.forEach(issue => console.log(issue));
      return { success: false, issues };
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

/**
 * Initialize database with default data
 */
export async function initializeDatabase() {
  console.log('🚀 Initializing database...');
  
  try {
    // 1. Run migration
    await migrateDatabaseStructure();
    
    // 2. Fix community admins
    await fixCommunityAdmins();
    
    // 3. Verify structure
    const verification = await verifyDatabaseStructure();
    
    if (verification.success) {
      console.log('✅ Database initialized successfully!');
    } else {
      console.log('⚠️ Database initialized with warnings. Please review issues.');
    }
    
    return verification;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Reset user's community membership
 */
export async function resetUserCommunities(userId) {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      communities: {},
      communityId: null,
      updatedAt: new Date()
    });
    console.log(`✅ Reset communities for user: ${userId}`);
  } catch (error) {
    console.error('❌ Failed to reset user communities:', error);
    throw error;
  }
}

/**
 * Add user to community with role
 */
export async function addUserToCommunity(userId, communityId, role = 'member') {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const communities = userData.communities || {};
    
    // Add community with role
    communities[communityId] = role;
    
    await updateDoc(userRef, {
      communities,
      communityId: communityId, // Set as default
      updatedAt: new Date()
    });
    
    // Update community member count
    const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId);
    const communityDoc = await getDoc(communityRef);
    
    if (communityDoc.exists()) {
      const memberCount = (communityDoc.data().memberCount || 0) + 1;
      await updateDoc(communityRef, {
        memberCount,
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Added user ${userId} to community ${communityId} as ${role}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Failed to add user to community:', error);
    throw error;
  }
}

/**
 * Remove user from community
 */
export async function removeUserFromCommunity(userId, communityId) {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const communities = userData.communities || {};
    
    // Remove community
    delete communities[communityId];
    
    // Update default communityId if it was the removed one
    const updates = { communities, updatedAt: new Date() };
    if (userData.communityId === communityId) {
      const newDefaultCommunity = Object.keys(communities)[0] || null;
      updates.communityId = newDefaultCommunity;
    }
    
    await updateDoc(userRef, updates);
    
    // Update community member count
    const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId);
    const communityDoc = await getDoc(communityRef);
    
    if (communityDoc.exists()) {
      const memberCount = Math.max(0, (communityDoc.data().memberCount || 1) - 1);
      await updateDoc(communityRef, {
        memberCount,
        updatedAt: new Date()
      });
    }
    
    console.log(`✅ Removed user ${userId} from community ${communityId}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Failed to remove user from community:', error);
    throw error;
  }
}

export default {
  migrateDatabaseStructure,
  createSuperAdmin,
  fixCommunityAdmins,
  verifyDatabaseStructure,
  initializeDatabase,
  resetUserCommunities,
  addUserToCommunity,
  removeUserFromCommunity
};
