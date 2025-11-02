/**
 * Gamification System for Volunteers
 * Tracks achievements, milestones, and rewards
 */

import { doc, getDoc, updateDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';

// Achievement Levels
export const VOLUNTEER_LEVELS = {
  NEWCOMER: { level: 1, name: 'Newcomer', minPoints: 0, badge: '🌱' },
  HELPER: { level: 2, name: 'Helper', minPoints: 50, badge: '🤝' },
  CONTRIBUTOR: { level: 3, name: 'Contributor', minPoints: 150, badge: '⭐' },
  CHAMPION: { level: 4, name: 'Champion', minPoints: 300, badge: '🏆' },
  HERO: { level: 5, name: 'Hero', minPoints: 500, badge: '💎' },
  LEGEND: { level: 6, name: 'Legend', minPoints: 1000, badge: '👑' }
};

// Milestone Achievements
export const MILESTONES = {
  FIRST_HELP: {
    id: 'first_help',
    name: 'First Help',
    description: 'Complete your first request',
    points: 10,
    icon: '🎯',
    requirement: { requestsCompleted: 1 }
  },
  FIVE_HELPS: {
    id: 'five_helps',
    name: 'Helping Hand',
    description: 'Complete 5 requests',
    points: 25,
    icon: '✋',
    requirement: { requestsCompleted: 5 }
  },
  TEN_HELPS: {
    id: 'ten_helps',
    name: 'Community Star',
    description: 'Complete 10 requests',
    points: 50,
    icon: '⭐',
    requirement: { requestsCompleted: 10 }
  },
  TWENTY_FIVE_HELPS: {
    id: 'twenty_five_helps',
    name: 'Super Volunteer',
    description: 'Complete 25 requests',
    points: 100,
    icon: '🦸',
    requirement: { requestsCompleted: 25 }
  },
  FIFTY_HELPS: {
    id: 'fifty_helps',
    name: 'Community Hero',
    description: 'Complete 50 requests',
    points: 200,
    icon: '🏅',
    requirement: { requestsCompleted: 50 }
  },
  HUNDRED_HELPS: {
    id: 'hundred_helps',
    name: 'Legend',
    description: 'Complete 100 requests',
    points: 500,
    icon: '👑',
    requirement: { requestsCompleted: 100 }
  },
  PERFECT_RATING: {
    id: 'perfect_rating',
    name: 'Five Star Service',
    description: 'Maintain 5.0 average rating with 10+ reviews',
    points: 75,
    icon: '🌟',
    requirement: { averageRating: 5.0, ratingsCount: 10 }
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete 5 requests within 24 hours of claiming',
    points: 50,
    icon: '⚡',
    requirement: { fastCompletions: 5 }
  },
  WEEK_STREAK: {
    id: 'week_streak',
    name: 'Week Warrior',
    description: 'Help someone every day for 7 days',
    points: 100,
    icon: '🔥',
    requirement: { consecutiveDays: 7 }
  },
  MONTH_STREAK: {
    id: 'month_streak',
    name: 'Monthly Champion',
    description: 'Help someone every day for 30 days',
    points: 300,
    icon: '💪',
    requirement: { consecutiveDays: 30 }
  },
  CATEGORY_MASTER: {
    id: 'category_master',
    name: 'Category Master',
    description: 'Complete 10 requests in a single category',
    points: 75,
    icon: '🎓',
    requirement: { categoryCompletions: 10 }
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Claim 10 requests within 1 hour of posting',
    points: 50,
    icon: '🐦',
    requirement: { earlyClaimsCount: 10 }
  }
};

/**
 * Initialize gamification profile for a user
 */
export const initializeGamificationProfile = async (userId) => {
  try {
    const profileRef = doc(db, 'gamification', userId);
    const profileDoc = await getDoc(profileRef);
    
    if (!profileDoc.exists()) {
      await setDoc(profileRef, {
        userId,
        points: 0,
        level: 1,
        requestsCompleted: 0,
        averageRating: 0,
        ratingsCount: 0,
        achievements: [],
        categoryStats: {},
        streakDays: 0,
        lastHelpDate: null,
        fastCompletions: 0,
        earlyClaimsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return profileDoc.exists() ? profileDoc.data() : null;
  } catch (error) {
    console.error('Error initializing gamification profile:', error);
    throw error;
  }
};

/**
 * Get user's gamification profile
 */
export const getGamificationProfile = async (userId) => {
  try {
    const profileRef = doc(db, 'gamification', userId);
    const profileDoc = await getDoc(profileRef);
    
    if (!profileDoc.exists()) {
      await initializeGamificationProfile(userId);
      return await getGamificationProfile(userId);
    }
    
    return {
      id: profileDoc.id,
      ...profileDoc.data()
    };
  } catch (error) {
    console.error('Error getting gamification profile:', error);
    throw error;
  }
};

/**
 * Calculate user's level based on points
 */
export const calculateLevel = (points) => {
  const levels = Object.values(VOLUNTEER_LEVELS).sort((a, b) => b.minPoints - a.minPoints);
  
  for (const level of levels) {
    if (points >= level.minPoints) {
      return level;
    }
  }
  
  return VOLUNTEER_LEVELS.NEWCOMER;
};

/**
 * Check and award achievements
 */
export const checkAndAwardAchievements = async (userId, profile) => {
  try {
    const newAchievements = [];
    const existingAchievements = profile.achievements || [];
    
    for (const milestone of Object.values(MILESTONES)) {
      // Skip if already earned
      if (existingAchievements.includes(milestone.id)) {
        continue;
      }
      
      // Check if requirements are met
      let requirementMet = true;
      
      if (milestone.requirement.requestsCompleted) {
        requirementMet = profile.requestsCompleted >= milestone.requirement.requestsCompleted;
      }
      
      if (milestone.requirement.averageRating && milestone.requirement.ratingsCount) {
        requirementMet = requirementMet && 
          profile.averageRating >= milestone.requirement.averageRating &&
          profile.ratingsCount >= milestone.requirement.ratingsCount;
      }
      
      if (milestone.requirement.fastCompletions) {
        requirementMet = requirementMet && 
          profile.fastCompletions >= milestone.requirement.fastCompletions;
      }
      
      if (milestone.requirement.consecutiveDays) {
        requirementMet = requirementMet && 
          profile.streakDays >= milestone.requirement.consecutiveDays;
      }
      
      if (milestone.requirement.categoryCompletions) {
        const maxCategoryCount = Math.max(...Object.values(profile.categoryStats || {}));
        requirementMet = requirementMet && 
          maxCategoryCount >= milestone.requirement.categoryCompletions;
      }
      
      if (milestone.requirement.earlyClaimsCount) {
        requirementMet = requirementMet && 
          profile.earlyClaimsCount >= milestone.requirement.earlyClaimsCount;
      }
      
      // Award achievement
      if (requirementMet) {
        newAchievements.push(milestone);
      }
    }
    
    // Update profile with new achievements
    if (newAchievements.length > 0) {
      const profileRef = doc(db, 'gamification', userId);
      const newAchievementIds = newAchievements.map(a => a.id);
      const totalNewPoints = newAchievements.reduce((sum, a) => sum + a.points, 0);
      
      await updateDoc(profileRef, {
        achievements: [...existingAchievements, ...newAchievementIds],
        points: increment(totalNewPoints),
        updatedAt: serverTimestamp()
      });
      
      return newAchievements;
    }
    
    return [];
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
};

/**
 * Award points for completing a request
 */
export const awardPointsForCompletion = async (userId, requestData, completionTime) => {
  try {
    const profile = await getGamificationProfile(userId);
    const profileRef = doc(db, 'gamification', userId);
    
    // Base points for completion
    let points = 10;
    
    // Bonus for urgency
    if (requestData.urgency === 'high') {
      points += 5;
    } else if (requestData.urgency === 'medium') {
      points += 3;
    }
    
    // Bonus for fast completion (within 24 hours)
    const isFastCompletion = completionTime && completionTime < 24 * 60 * 60 * 1000;
    if (isFastCompletion) {
      points += 5;
    }
    
    // Update category stats
    const categoryStats = profile.categoryStats || {};
    const category = requestData.category || 'Other';
    categoryStats[category] = (categoryStats[category] || 0) + 1;
    
    // Update streak
    const today = new Date().toDateString();
    const lastHelpDate = profile.lastHelpDate ? new Date(profile.lastHelpDate).toDateString() : null;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    let newStreakDays = profile.streakDays || 0;
    if (lastHelpDate === yesterday) {
      newStreakDays += 1;
    } else if (lastHelpDate !== today) {
      newStreakDays = 1;
    }
    
    // Update profile
    await updateDoc(profileRef, {
      points: increment(points),
      requestsCompleted: increment(1),
      categoryStats,
      streakDays: newStreakDays,
      lastHelpDate: today,
      fastCompletions: isFastCompletion ? increment(1) : profile.fastCompletions,
      updatedAt: serverTimestamp()
    });
    
    // Check for new achievements
    const updatedProfile = await getGamificationProfile(userId);
    const newAchievements = await checkAndAwardAchievements(userId, updatedProfile);
    
    // Calculate new level
    const newLevel = calculateLevel(updatedProfile.points);
    const oldLevel = calculateLevel(profile.points);
    const leveledUp = newLevel.level > oldLevel.level;
    
    if (leveledUp) {
      await updateDoc(profileRef, {
        level: newLevel.level,
        updatedAt: serverTimestamp()
      });
    }
    
    return {
      pointsAwarded: points,
      newAchievements,
      leveledUp,
      newLevel: leveledUp ? newLevel : null,
      totalPoints: updatedProfile.points + points
    };
  } catch (error) {
    console.error('Error awarding points:', error);
    throw error;
  }
};

/**
 * Update rating statistics
 */
export const updateRatingStats = async (userId, newRating) => {
  try {
    const profile = await getGamificationProfile(userId);
    const profileRef = doc(db, 'gamification', userId);
    
    const currentTotal = profile.averageRating * profile.ratingsCount;
    const newTotal = currentTotal + newRating;
    const newCount = profile.ratingsCount + 1;
    const newAverage = newTotal / newCount;
    
    await updateDoc(profileRef, {
      averageRating: newAverage,
      ratingsCount: newCount,
      updatedAt: serverTimestamp()
    });
    
    // Check for rating-based achievements
    const updatedProfile = await getGamificationProfile(userId);
    await checkAndAwardAchievements(userId, updatedProfile);
    
    return newAverage;
  } catch (error) {
    console.error('Error updating rating stats:', error);
    throw error;
  }
};

/**
 * Track early claim (claimed within 1 hour of posting)
 */
export const trackEarlyClaim = async (userId, requestCreatedAt) => {
  try {
    const claimTime = Date.now();
    const postTime = requestCreatedAt.toMillis ? requestCreatedAt.toMillis() : requestCreatedAt;
    const timeDiff = claimTime - postTime;
    
    // If claimed within 1 hour
    if (timeDiff < 60 * 60 * 1000) {
      const profileRef = doc(db, 'gamification', userId);
      await updateDoc(profileRef, {
        earlyClaimsCount: increment(1),
        updatedAt: serverTimestamp()
      });
      
      // Check for achievements
      const profile = await getGamificationProfile(userId);
      await checkAndAwardAchievements(userId, profile);
    }
  } catch (error) {
    console.error('Error tracking early claim:', error);
  }
};

/**
 * Get leaderboard for a community
 */
export const getCommunityLeaderboard = async (communityId, limit = 10) => {
  try {
    const { collection, query, where, orderBy, getDocs, limit: firestoreLimit } = await import('firebase/firestore');
    
    const leaderboardQuery = query(
      collection(db, 'gamification'),
      orderBy('points', 'desc'),
      firestoreLimit(limit)
    );
    
    const snapshot = await getDocs(leaderboardQuery);
    const leaderboard = [];
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const level = calculateLevel(data.points);
      
      // Get user info
      const userRef = doc(db, COLLECTIONS.USERS, data.userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      leaderboard.push({
        userId: data.userId,
        userName: userData?.displayName || 'Anonymous',
        points: data.points,
        level: level.name,
        badge: level.badge,
        requestsCompleted: data.requestsCompleted,
        averageRating: data.averageRating,
        achievements: data.achievements?.length || 0
      });
    }
    
    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};

export default {
  VOLUNTEER_LEVELS,
  MILESTONES,
  initializeGamificationProfile,
  getGamificationProfile,
  calculateLevel,
  checkAndAwardAchievements,
  awardPointsForCompletion,
  updateRatingStats,
  trackEarlyClaim,
  getCommunityLeaderboard
};
