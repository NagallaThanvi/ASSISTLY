import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';

// Admin Role Types
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',      // Platform-wide admin
  COMMUNITY_ADMIN: 'community_admin', // Community-specific admin
  MODERATOR: 'moderator'            // Limited moderation powers
};

// Admin Permissions
export const ADMIN_PERMISSIONS = {
  // User Management
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  BAN_USERS: 'ban_users',
  
  // Request Management
  VIEW_ALL_REQUESTS: 'view_all_requests',
  EDIT_REQUESTS: 'edit_requests',
  DELETE_REQUESTS: 'delete_requests',
  FEATURE_REQUESTS: 'feature_requests',
  
  // Community Management
  EDIT_COMMUNITY: 'edit_community',
  MANAGE_BRANDING: 'manage_branding',
  VIEW_STATISTICS: 'view_statistics',
  MANAGE_ADMINS: 'manage_admins',
  
  // Content Moderation
  MODERATE_CONTENT: 'moderate_content',
  VIEW_REPORTS: 'view_reports',
  
  // Settings
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_LOGS: 'view_logs'
};

// Role-Permission Mapping
export const ROLE_PERMISSIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: Object.values(ADMIN_PERMISSIONS),
  [ADMIN_ROLES.COMMUNITY_ADMIN]: [
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.MANAGE_USERS,
    ADMIN_PERMISSIONS.VIEW_ALL_REQUESTS,
    ADMIN_PERMISSIONS.EDIT_REQUESTS,
    ADMIN_PERMISSIONS.DELETE_REQUESTS,
    ADMIN_PERMISSIONS.FEATURE_REQUESTS,
    ADMIN_PERMISSIONS.EDIT_COMMUNITY,
    ADMIN_PERMISSIONS.MANAGE_BRANDING,
    ADMIN_PERMISSIONS.VIEW_STATISTICS,
    ADMIN_PERMISSIONS.MODERATE_CONTENT,
    ADMIN_PERMISSIONS.VIEW_REPORTS,
    ADMIN_PERMISSIONS.MANAGE_SETTINGS,
    ADMIN_PERMISSIONS.VIEW_LOGS
  ],
  [ADMIN_ROLES.MODERATOR]: [
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.VIEW_ALL_REQUESTS,
    ADMIN_PERMISSIONS.MODERATE_CONTENT,
    ADMIN_PERMISSIONS.VIEW_REPORTS,
    ADMIN_PERMISSIONS.VIEW_STATISTICS
  ]
};

/**
 * Check if user is an admin
 */
export const isAdmin = async (userId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role && Object.values(ADMIN_ROLES).includes(userData.role);
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Check if user is a community admin
 */
export const isCommunityAdmin = async (userId, communityId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return (
        userData.role === ADMIN_ROLES.COMMUNITY_ADMIN &&
        userData.communityId === communityId
      ) || userData.role === ADMIN_ROLES.SUPER_ADMIN;
    }
    return false;
  } catch (error) {
    console.error('Error checking community admin status:', error);
    return false;
  }
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

/**
 * Assign admin role to user
 */
export const assignAdminRole = async (userId, role, communityId = null) => {
  try {
    if (!Object.values(ADMIN_ROLES).includes(role)) {
      throw new Error('Invalid admin role');
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const updateData = {
      role: role,
      roleAssignedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (role === ADMIN_ROLES.COMMUNITY_ADMIN && communityId) {
      updateData.adminCommunityId = communityId;
    }

    await updateDoc(userRef, updateData);
    
    // Log the action
    await logAdminAction({
      action: 'ROLE_ASSIGNED',
      targetUserId: userId,
      role: role,
      communityId: communityId,
      timestamp: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error assigning admin role:', error);
    throw error;
  }
};

/**
 * Remove admin role from user
 */
export const removeAdminRole = async (userId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      role: null,
      adminCommunityId: null,
      roleAssignedAt: null,
      updatedAt: serverTimestamp()
    });

    await logAdminAction({
      action: 'ROLE_REMOVED',
      targetUserId: userId,
      timestamp: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error removing admin role:', error);
    throw error;
  }
};

/**
 * Get all admins for a community
 */
export const getCommunityAdmins = async (communityId) => {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(
      usersRef,
      where('communityId', '==', communityId),
      where('role', 'in', [ADMIN_ROLES.COMMUNITY_ADMIN, ADMIN_ROLES.MODERATOR])
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching community admins:', error);
    throw error;
  }
};

/**
 * Log admin action
 */
export const logAdminAction = async (actionData) => {
  try {
    const logsRef = collection(db, 'admin_logs');
    await setDoc(doc(logsRef), {
      ...actionData,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

/**
 * Get admin activity logs
 */
export const getAdminLogs = async (communityId, limit = 50) => {
  try {
    const logsRef = collection(db, 'admin_logs');
    const q = query(
      logsRef,
      where('communityId', '==', communityId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    throw error;
  }
};

/**
 * Ban/Suspend user
 */
export const banUser = async (userId, reason, duration = null, adminId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      banned: true,
      banReason: reason,
      bannedAt: serverTimestamp(),
      bannedBy: adminId,
      banDuration: duration,
      updatedAt: serverTimestamp()
    });

    await logAdminAction({
      action: 'USER_BANNED',
      targetUserId: userId,
      performedBy: adminId,
      reason: reason,
      duration: duration,
      timestamp: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
};

/**
 * Unban user
 */
export const unbanUser = async (userId, adminId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      banned: false,
      banReason: null,
      bannedAt: null,
      bannedBy: null,
      banDuration: null,
      unbannedAt: serverTimestamp(),
      unbannedBy: adminId,
      updatedAt: serverTimestamp()
    });

    await logAdminAction({
      action: 'USER_UNBANNED',
      targetUserId: userId,
      performedBy: adminId,
      timestamp: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
};
