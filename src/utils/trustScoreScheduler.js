/**
 * Trust Score Update Scheduler
 * Automatically updates trust scores at appropriate intervals
 */

import { updateUserTrustScore, batchUpdateTrustScores } from './trustScore';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Schedule trust score update for a specific user
 * Call this after significant events (request completion, rating, etc.)
 */
export async function scheduleTrustScoreUpdate(userId, communityId, priority = 'normal') {
  try {
    // For high priority updates (e.g., after completing a request), update immediately
    if (priority === 'high') {
      await updateUserTrustScore(userId, communityId);
      console.log(`Trust score updated immediately for user ${userId}`);
      return;
    }

    // For normal priority, check if update is needed
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
    
    if (userDoc.empty) return;
    
    const userData = userDoc.docs[0].data();
    const lastUpdate = userData?.trustUpdatedAt?.toDate();
    const now = new Date();
    
    // Update if last update was more than 24 hours ago
    if (!lastUpdate || (now - lastUpdate) > 24 * 60 * 60 * 1000) {
      await updateUserTrustScore(userId, communityId);
      console.log(`Trust score updated for user ${userId}`);
    }
  } catch (error) {
    console.error('Error scheduling trust score update:', error);
  }
}

/**
 * Initialize trust score update scheduler
 * Sets up periodic batch updates for all users
 */
export function initializeTrustScoreScheduler(communityId) {
  // Update all users daily at 2 AM
  const scheduleDaily = () => {
    const now = new Date();
    const next2AM = new Date(now);
    next2AM.setHours(2, 0, 0, 0);
    
    // If it's past 2 AM today, schedule for tomorrow
    if (now > next2AM) {
      next2AM.setDate(next2AM.getDate() + 1);
    }
    
    const timeUntil2AM = next2AM - now;
    
    setTimeout(async () => {
      console.log('Running daily trust score batch update...');
      await batchUpdateTrustScores(communityId);
      
      // Schedule next update
      scheduleDaily();
    }, timeUntil2AM);
    
    console.log(`Next trust score batch update scheduled for ${next2AM.toLocaleString()}`);
  };
  
  scheduleDaily();
}

/**
 * Update trust score after request completion
 * Call this when a request is marked as completed
 */
export async function updateTrustScoreAfterCompletion(volunteerId, requesterId, communityId) {
  try {
    // Update volunteer's trust score (high priority - they just helped someone)
    await scheduleTrustScoreUpdate(volunteerId, communityId, 'high');
    
    // Update requester's trust score (normal priority)
    await scheduleTrustScoreUpdate(requesterId, communityId, 'normal');
    
    console.log('Trust scores updated after request completion');
  } catch (error) {
    console.error('Error updating trust scores after completion:', error);
  }
}

/**
 * Update trust score after receiving a rating
 * Call this when a user rates another user
 */
export async function updateTrustScoreAfterRating(ratedUserId, communityId) {
  try {
    // Ratings significantly affect trust score, so update immediately
    await scheduleTrustScoreUpdate(ratedUserId, communityId, 'high');
    
    console.log(`Trust score updated after rating for user ${ratedUserId}`);
  } catch (error) {
    console.error('Error updating trust score after rating:', error);
  }
}

/**
 * Update trust score after report
 * Call this when a user is reported
 */
export async function updateTrustScoreAfterReport(reportedUserId, communityId) {
  try {
    // Reports negatively affect trust score, update immediately
    await scheduleTrustScoreUpdate(reportedUserId, communityId, 'high');
    
    console.log(`Trust score updated after report for user ${reportedUserId}`);
  } catch (error) {
    console.error('Error updating trust score after report:', error);
  }
}

/**
 * Manual trust score refresh for a user
 * Can be called from admin panel or user profile
 */
export async function refreshTrustScore(userId, communityId) {
  try {
    const trustData = await updateUserTrustScore(userId, communityId);
    return trustData;
  } catch (error) {
    console.error('Error refreshing trust score:', error);
    return null;
  }
}

/**
 * Get users who need trust score updates
 * Returns list of users whose trust scores are outdated
 */
export async function getUsersNeedingUpdate(communityId, hoursThreshold = 24) {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where(`communities.${communityId}`, '!=', null)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const now = new Date();
    const threshold = hoursThreshold * 60 * 60 * 1000;
    
    const usersNeedingUpdate = usersSnapshot.docs.filter(doc => {
      const userData = doc.data();
      const lastUpdate = userData?.trustUpdatedAt?.toDate();
      
      if (!lastUpdate) return true; // Never updated
      
      const timeSinceUpdate = now - lastUpdate;
      return timeSinceUpdate > threshold;
    });
    
    return usersNeedingUpdate.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users needing update:', error);
    return [];
  }
}

/**
 * Update trust scores for users who need it
 * More efficient than batch updating everyone
 */
export async function updateOutdatedTrustScores(communityId) {
  try {
    const users = await getUsersNeedingUpdate(communityId);
    
    console.log(`Updating trust scores for ${users.length} users...`);
    
    const updates = users.map(user => 
      updateUserTrustScore(user.id, communityId)
    );
    
    await Promise.all(updates);
    
    console.log(`Updated trust scores for ${users.length} users`);
    return users.length;
  } catch (error) {
    console.error('Error updating outdated trust scores:', error);
    return 0;
  }
}

// Export all functions
export default {
  scheduleTrustScoreUpdate,
  initializeTrustScoreScheduler,
  updateTrustScoreAfterCompletion,
  updateTrustScoreAfterRating,
  updateTrustScoreAfterReport,
  refreshTrustScore,
  getUsersNeedingUpdate,
  updateOutdatedTrustScores
};
