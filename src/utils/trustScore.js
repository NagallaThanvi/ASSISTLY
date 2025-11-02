/**
 * Trust Score Calculation System
 * Calculates user reliability and trustworthiness (0-100%)
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Calculate comprehensive trust score for a user
 * @param {string} userId - User ID
 * @param {string} communityId - Community ID
 * @returns {Promise<Object>} Trust score and breakdown
 */
export async function calculateTrustScore(userId, communityId) {
  try {
    // Get user data
    const userQuery = query(
      collection(db, 'users'),
      where('__name__', '==', userId)
    );
    const userSnapshot = await getDocs(userQuery);
    const userData = userSnapshot.docs[0]?.data();

    if (!userData) {
      return {
        score: 50, // Default for new users
        breakdown: {},
        level: 'New User'
      };
    }

    // Get user's requests as volunteer
    const volunteerRequestsQuery = query(
      collection(db, 'requests'),
      where('volunteerId', '==', userId),
      where('communityId', '==', communityId)
    );
    const volunteerRequests = await getDocs(volunteerRequestsQuery);

    // Get user's requests as requester
    const requesterRequestsQuery = query(
      collection(db, 'requests'),
      where('createdByUid', '==', userId),
      where('communityId', '==', communityId)
    );
    const requesterRequests = await getDocs(requesterRequestsQuery);

    // Calculate metrics
    const metrics = {
      completionRate: calculateCompletionRate(volunteerRequests.docs),
      responseTime: calculateResponseTime(volunteerRequests.docs),
      rating: calculateAverageRating(volunteerRequests.docs, requesterRequests.docs),
      accountAge: calculateAccountAge(userData.createdAt),
      activityLevel: calculateActivityLevel(volunteerRequests.docs, requesterRequests.docs),
      reportHistory: calculateReportScore(userData.reports || []),
      verificationStatus: calculateVerificationScore(userData)
    };

    // Weight each metric
    const weights = {
      completionRate: 0.25,    // 25% - Most important
      responseTime: 0.15,      // 15%
      rating: 0.20,            // 20%
      accountAge: 0.10,        // 10%
      activityLevel: 0.15,     // 15%
      reportHistory: 0.10,     // 10%
      verificationStatus: 0.05 // 5%
    };

    // Calculate weighted score
    let totalScore = 0;
    for (const [metric, value] of Object.entries(metrics)) {
      totalScore += value * weights[metric];
    }

    // Round to integer
    const finalScore = Math.round(totalScore);

    // Determine trust level
    const level = getTrustLevel(finalScore);

    return {
      score: finalScore,
      breakdown: metrics,
      level,
      badge: getTrustBadge(finalScore)
    };
  } catch (error) {
    console.error('Error calculating trust score:', error);
    return {
      score: 50,
      breakdown: {},
      level: 'Unknown',
      badge: '❓'
    };
  }
}

/**
 * Calculate completion rate (0-100)
 */
function calculateCompletionRate(requests) {
  if (requests.length === 0) return 75; // Default for new users

  const completed = requests.filter(doc => doc.data().status === 'completed').length;
  const claimed = requests.filter(doc => 
    ['claimed', 'pending_completion', 'completed'].includes(doc.data().status)
  ).length;

  if (claimed === 0) return 75;
  return (completed / claimed) * 100;
}

/**
 * Calculate average response time score (0-100)
 */
function calculateResponseTime(requests) {
  if (requests.length === 0) return 75;

  const responseTimes = requests
    .map(doc => {
      const data = doc.data();
      if (!data.claimedAt || !data.createdAt) return null;
      
      const created = data.createdAt.toDate();
      const claimed = data.claimedAt.toDate();
      const hours = (claimed - created) / (1000 * 60 * 60);
      return hours;
    })
    .filter(time => time !== null);

  if (responseTimes.length === 0) return 75;

  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  // Score based on response time
  // < 1 hour = 100, < 6 hours = 90, < 24 hours = 80, < 48 hours = 70, > 48 hours = 60
  if (avgResponseTime < 1) return 100;
  if (avgResponseTime < 6) return 90;
  if (avgResponseTime < 24) return 80;
  if (avgResponseTime < 48) return 70;
  return 60;
}

/**
 * Calculate average rating (0-100)
 */
function calculateAverageRating(volunteerRequests, requesterRequests) {
  const allRequests = [...volunteerRequests, ...requesterRequests];
  
  const ratings = allRequests
    .map(doc => doc.data().rating)
    .filter(rating => rating !== undefined && rating !== null);

  if (ratings.length === 0) return 75; // Default for no ratings

  const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return (avgRating / 5) * 100; // Convert 5-star to 100-point scale
}

/**
 * Calculate account age score (0-100)
 */
function calculateAccountAge(createdAt) {
  if (!createdAt) return 50;

  const created = createdAt.toDate();
  const now = new Date();
  const daysSinceCreation = (now - created) / (1000 * 60 * 60 * 24);

  // Score based on account age
  // > 365 days = 100, > 180 days = 90, > 90 days = 80, > 30 days = 70, < 30 days = 60
  if (daysSinceCreation > 365) return 100;
  if (daysSinceCreation > 180) return 90;
  if (daysSinceCreation > 90) return 80;
  if (daysSinceCreation > 30) return 70;
  return 60;
}

/**
 * Calculate activity level score (0-100)
 */
function calculateActivityLevel(volunteerRequests, requesterRequests) {
  const totalActivity = volunteerRequests.length + requesterRequests.length;

  // Score based on total activity
  // > 50 = 100, > 25 = 90, > 10 = 80, > 5 = 70, < 5 = 60
  if (totalActivity > 50) return 100;
  if (totalActivity > 25) return 90;
  if (totalActivity > 10) return 80;
  if (totalActivity > 5) return 70;
  return 60;
}

/**
 * Calculate report history score (0-100)
 */
function calculateReportScore(reports) {
  if (reports.length === 0) return 100; // No reports = perfect

  // Deduct points for each report
  const deduction = reports.length * 15;
  return Math.max(0, 100 - deduction);
}

/**
 * Calculate verification status score (0-100)
 */
function calculateVerificationScore(userData) {
  let score = 0;

  if (userData.emailVerified) score += 40;
  if (userData.phoneVerified) score += 30;
  if (userData.idVerified) score += 30;

  return score;
}

/**
 * Get trust level based on score
 */
function getTrustLevel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
}

/**
 * Get trust badge emoji
 */
function getTrustBadge(score) {
  if (score >= 90) return '🏆'; // Excellent
  if (score >= 80) return '⭐'; // Very Good
  if (score >= 70) return '✅'; // Good
  if (score >= 60) return '👍'; // Fair
  if (score >= 50) return '🆗'; // Average
  return '⚠️'; // Needs Improvement
}

/**
 * Get trust score color
 */
export function getTrustScoreColor(score) {
  if (score >= 90) return '#4CAF50'; // Green
  if (score >= 80) return '#8BC34A'; // Light Green
  if (score >= 70) return '#FFC107'; // Amber
  if (score >= 60) return '#FF9800'; // Orange
  if (score >= 50) return '#FF5722'; // Deep Orange
  return '#F44336'; // Red
}

/**
 * Update user's trust score in database
 */
export async function updateUserTrustScore(userId, communityId) {
  try {
    const trustData = await calculateTrustScore(userId, communityId);
    
    // Update user document
    const { doc, updateDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      trustScore: trustData.score,
      trustLevel: trustData.level,
      trustBadge: trustData.badge,
      trustUpdatedAt: new Date()
    });

    return trustData;
  } catch (error) {
    console.error('Error updating trust score:', error);
    return null;
  }
}

/**
 * Batch update trust scores for all community members
 */
export async function batchUpdateTrustScores(communityId) {
  try {
    // Get all users in community
    const usersQuery = query(
      collection(db, 'users'),
      where(`communities.${communityId}`, '!=', null)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    // Update each user's trust score
    const updates = usersSnapshot.docs.map(doc => 
      updateUserTrustScore(doc.id, communityId)
    );

    await Promise.all(updates);
    
    console.log(`Updated trust scores for ${updates.length} users`);
    return true;
  } catch (error) {
    console.error('Error batch updating trust scores:', error);
    return false;
  }
}
