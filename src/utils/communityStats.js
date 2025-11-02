import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';

/**
 * Get comprehensive community statistics
 */
export const getCommunityStatistics = async (communityId) => {
  try {
    const stats = {
      overview: {},
      users: {},
      requests: {},
      engagement: {},
      trends: {}
    };

    // Get community info
    const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId);
    const communityDoc = await getDoc(communityRef);
    stats.overview.communityInfo = communityDoc.exists() ? communityDoc.data() : null;

    // Get all users in community
    const usersQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('communityId', '==', communityId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => doc.data());

    // User Statistics
    stats.users.total = users.length;
    stats.users.residents = users.filter(u => u.userType === 'resident').length;
    stats.users.volunteers = users.filter(u => u.userType === 'volunteer').length;
    stats.users.both = users.filter(u => u.userType === 'both').length;
    stats.users.activeUsers = users.filter(u => u.availability === 'available').length;
    stats.users.newThisMonth = users.filter(u => {
      const joinedAt = u.joinedAt?.toDate?.() || new Date(u.joinedAt);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return joinedAt > monthAgo;
    }).length;

    // Get all requests in community
    const requestsQuery = query(
      collection(db, COLLECTIONS.REQUESTS),
      where('communityId', '==', communityId)
    );
    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Request Statistics
    stats.requests.total = requests.length;
    stats.requests.open = requests.filter(r => r.status === 'open').length;
    stats.requests.claimed = requests.filter(r => r.status === 'claimed').length;
    stats.requests.completed = requests.filter(r => r.status === 'completed').length;
    stats.requests.cancelled = requests.filter(r => r.status === 'cancelled').length;
    stats.requests.pendingCompletion = requests.filter(r => r.status === 'pending_completion').length;

    // Category breakdown
    stats.requests.byCategory = requests.reduce((acc, req) => {
      const category = req.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Urgency breakdown
    stats.requests.byUrgency = {
      high: requests.filter(r => r.urgency === 'high').length,
      medium: requests.filter(r => r.urgency === 'medium').length,
      low: requests.filter(r => r.urgency === 'low').length
    };

    // Engagement Statistics
    stats.engagement.completionRate = stats.requests.total > 0
      ? ((stats.requests.completed / stats.requests.total) * 100).toFixed(1)
      : 0;
    
    stats.engagement.averageResponseTime = calculateAverageResponseTime(requests);
    stats.engagement.activeVolunteers = new Set(
      requests.filter(r => r.claimedByUid).map(r => r.claimedByUid)
    ).size;
    
    stats.engagement.topVolunteers = getTopVolunteers(requests, users);
    stats.engagement.topCategories = getTopCategories(stats.requests.byCategory);

    // Trend Statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRequests = requests.filter(r => {
      const createdAt = r.createdAt?.toDate?.() || new Date(r.createdAt);
      return createdAt > thirtyDaysAgo;
    });

    stats.trends.requestsLast30Days = recentRequests.length;
    stats.trends.completedLast30Days = recentRequests.filter(r => r.status === 'completed').length;
    stats.trends.newUsersLast30Days = users.filter(u => {
      const joinedAt = u.joinedAt?.toDate?.() || new Date(u.joinedAt);
      return joinedAt > thirtyDaysAgo;
    }).length;

    // Daily activity for charts
    stats.trends.dailyActivity = getDailyActivity(requests, 30);
    stats.trends.weeklyActivity = getWeeklyActivity(requests, 12);

    return stats;
  } catch (error) {
    console.error('Error fetching community statistics:', error);
    throw error;
  }
};

/**
 * Calculate average response time for requests
 */
const calculateAverageResponseTime = (requests) => {
  const claimedRequests = requests.filter(r => r.claimedByUid && r.createdAt && r.history);
  
  if (claimedRequests.length === 0) return 'N/A';

  const responseTimes = claimedRequests.map(req => {
    const createdAt = req.createdAt?.toDate?.() || new Date(req.createdAt);
    const claimedEvent = req.history?.find(h => h.type === 'claimed');
    
    if (claimedEvent) {
      const claimedAt = new Date(claimedEvent.at);
      return (claimedAt - createdAt) / (1000 * 60 * 60); // hours
    }
    return null;
  }).filter(t => t !== null);

  if (responseTimes.length === 0) return 'N/A';

  const avgHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  if (avgHours < 1) {
    return `${Math.round(avgHours * 60)} minutes`;
  } else if (avgHours < 24) {
    return `${avgHours.toFixed(1)} hours`;
  } else {
    return `${(avgHours / 24).toFixed(1)} days`;
  }
};

/**
 * Get top volunteers by completed requests
 */
const getTopVolunteers = (requests, users, limit = 5) => {
  const volunteerCounts = {};
  
  requests.filter(r => r.status === 'completed' && r.claimedByUid).forEach(req => {
    volunteerCounts[req.claimedByUid] = (volunteerCounts[req.claimedByUid] || 0) + 1;
  });

  return Object.entries(volunteerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([uid, count]) => {
      const user = users.find(u => u.uid === uid);
      return {
        uid,
        name: user?.displayName || 'Unknown',
        email: user?.email || '',
        completedRequests: count
      };
    });
};

/**
 * Get top categories by request count
 */
const getTopCategories = (categoryBreakdown, limit = 5) => {
  return Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, count]) => ({ category, count }));
};

/**
 * Get daily activity for the last N days
 */
const getDailyActivity = (requests, days = 30) => {
  const activity = {};
  const today = new Date();
  
  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    activity[dateStr] = { created: 0, completed: 0 };
  }

  // Count requests
  requests.forEach(req => {
    const createdAt = req.createdAt?.toDate?.() || new Date(req.createdAt);
    const dateStr = createdAt.toISOString().split('T')[0];
    
    if (activity[dateStr]) {
      activity[dateStr].created++;
      
      if (req.status === 'completed' && req.completedAt) {
        const completedAt = req.completedAt?.toDate?.() || new Date(req.completedAt);
        const completedDateStr = completedAt.toISOString().split('T')[0];
        if (activity[completedDateStr]) {
          activity[completedDateStr].completed++;
        }
      }
    }
  });

  return Object.entries(activity)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({ date, ...data }));
};

/**
 * Get weekly activity for the last N weeks
 */
const getWeeklyActivity = (requests, weeks = 12) => {
  const activity = {};
  const today = new Date();
  
  // Initialize all weeks
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekNum = getWeekNumber(weekStart);
    activity[weekNum] = { created: 0, completed: 0 };
  }

  // Count requests
  requests.forEach(req => {
    const createdAt = req.createdAt?.toDate?.() || new Date(req.createdAt);
    const weekNum = getWeekNumber(createdAt);
    
    if (activity[weekNum]) {
      activity[weekNum].created++;
      
      if (req.status === 'completed' && req.completedAt) {
        const completedAt = req.completedAt?.toDate?.() || new Date(req.completedAt);
        const completedWeekNum = getWeekNumber(completedAt);
        if (activity[completedWeekNum]) {
          activity[completedWeekNum].completed++;
        }
      }
    }
  });

  return Object.entries(activity)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, data]) => ({ week, ...data }));
};

/**
 * Get week number from date
 */
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

/**
 * Get user activity statistics
 */
export const getUserActivityStats = async (userId) => {
  try {
    const requestsCreated = query(
      collection(db, COLLECTIONS.REQUESTS),
      where('createdByUid', '==', userId)
    );
    const requestsHelped = query(
      collection(db, COLLECTIONS.REQUESTS),
      where('claimedByUid', '==', userId)
    );

    const [createdSnapshot, helpedSnapshot] = await Promise.all([
      getDocs(requestsCreated),
      getDocs(requestsHelped)
    ]);

    return {
      requestsCreated: createdSnapshot.size,
      requestsHelped: helpedSnapshot.size,
      requestsCompleted: helpedSnapshot.docs.filter(
        doc => doc.data().status === 'completed'
      ).length
    };
  } catch (error) {
    console.error('Error fetching user activity stats:', error);
    throw error;
  }
};

/**
 * Export statistics as CSV
 */
export const exportStatisticsCSV = (stats) => {
  const rows = [
    ['Community Statistics Report'],
    ['Generated:', new Date().toLocaleString()],
    [''],
    ['Overview'],
    ['Total Users', stats.users.total],
    ['Total Requests', stats.requests.total],
    ['Completion Rate', `${stats.engagement.completionRate}%`],
    [''],
    ['User Breakdown'],
    ['Residents', stats.users.residents],
    ['Volunteers', stats.users.volunteers],
    ['Both', stats.users.both],
    [''],
    ['Request Status'],
    ['Open', stats.requests.open],
    ['Claimed', stats.requests.claimed],
    ['Completed', stats.requests.completed],
    ['Cancelled', stats.requests.cancelled]
  ];

  return rows.map(row => row.join(',')).join('\n');
};
