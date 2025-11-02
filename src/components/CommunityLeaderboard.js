import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
  Grid,
  IconButton,
  Badge
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  Favorite as HeartIcon,
  WorkspacePremium as BadgeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function CommunityLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // 'all', 'month', 'week'
  const [category, setCategory] = useState('points'); // 'points', 'completed', 'streak'
  const { communityId, userProfile } = useAuth();

  useEffect(() => {
    if (communityId) {
      fetchLeaderboard();
    }
  }, [communityId, timeframe, category]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Get all users in the community
      const usersQuery = query(
        collection(db, 'users'),
        where(`communities.${communityId}`, '!=', null)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate stats based on timeframe
      const now = new Date();
      let startDate = new Date(0); // Beginning of time

      if (timeframe === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeframe === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get requests for each user
      const leaderboard = await Promise.all(users.map(async (user) => {
        // Get completed requests as volunteer
        const completedQuery = query(
          collection(db, 'requests'),
          where('communityId', '==', communityId),
          where('volunteerId', '==', user.id),
          where('status', '==', 'completed')
        );
        
        const completedSnapshot = await getDocs(completedQuery);
        const completedRequests = completedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter by timeframe
        const filteredRequests = completedRequests.filter(req => {
          const completedAt = req.completedAt?.toDate() || new Date(0);
          return completedAt >= startDate;
        });

        return {
          id: user.id,
          name: user.displayName || user.email || 'Anonymous',
          email: user.email,
          avatar: user.photoURL,
          points: user.points || 0,
          level: user.level || 1,
          completedCount: filteredRequests.length,
          streak: user.streak || 0,
          achievements: user.achievements || [],
          trustScore: user.trustScore || 100,
          joinedAt: user.createdAt?.toDate() || new Date(),
          lastActive: user.lastActive?.toDate() || new Date()
        };
      }));

      // Sort based on category
      let sortedLeaderboard = [...leaderboard];
      if (category === 'points') {
        sortedLeaderboard.sort((a, b) => b.points - a.points);
      } else if (category === 'completed') {
        sortedLeaderboard.sort((a, b) => b.completedCount - a.completedCount);
      } else if (category === 'streak') {
        sortedLeaderboard.sort((a, b) => b.streak - a.streak);
      }

      // Add rank
      sortedLeaderboard = sortedLeaderboard.map((user, index) => ({
        ...user,
        rank: index + 1
      }));

      setLeaderboardData(sortedLeaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#757575'; // Gray
  };

  const getRankIcon = (rank) => {
    if (rank <= 3) {
      return <TrophyIcon sx={{ color: getRankColor(rank), fontSize: 32 }} />;
    }
    return <Typography variant="h6" color="text.secondary">#{rank}</Typography>;
  };

  const getLevelBadge = (level) => {
    const levels = [
      { min: 1, max: 4, name: 'Newcomer', color: '#9E9E9E' },
      { min: 5, max: 9, name: 'Helper', color: '#2196F3' },
      { min: 10, max: 19, name: 'Supporter', color: '#4CAF50' },
      { min: 20, max: 29, name: 'Champion', color: '#FF9800' },
      { min: 30, max: Infinity, name: 'Legend', color: '#9C27B0' }
    ];

    const levelInfo = levels.find(l => level >= l.min && level <= l.max);
    return (
      <Chip
        label={`${levelInfo.name} (Lv ${level})`}
        size="small"
        sx={{ bgcolor: levelInfo.color, color: 'white', fontWeight: 600 }}
      />
    );
  };

  const getProgressToNextLevel = (points) => {
    const pointsPerLevel = 100;
    const currentLevelPoints = points % pointsPerLevel;
    return (currentLevelPoints / pointsPerLevel) * 100;
  };

  return (
    <Box>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrophyIcon sx={{ fontSize: 48, color: '#FFD700' }} />
            <Box>
              <Typography variant="h4" fontWeight="700" color="white">
                Community Leaderboard
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Top contributors making a difference
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Timeframe Tabs */}
        <Tabs
          value={timeframe}
          onChange={(e, newValue) => setTimeframe(newValue)}
          sx={{
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 600 },
            '& .Mui-selected': { color: 'white !important' },
            '& .MuiTabs-indicator': { bgcolor: 'white' }
          }}
        >
          <Tab label="All Time" value="all" />
          <Tab label="This Month" value="month" />
          <Tab label="This Week" value="week" />
        </Tabs>
      </Paper>

      {/* Category Selector */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip
          icon={<StarIcon />}
          label="By Points"
          onClick={() => setCategory('points')}
          color={category === 'points' ? 'primary' : 'default'}
          sx={{ fontWeight: 600 }}
        />
        <Chip
          icon={<HeartIcon />}
          label="By Completed Requests"
          onClick={() => setCategory('completed')}
          color={category === 'completed' ? 'primary' : 'default'}
          sx={{ fontWeight: 600 }}
        />
        <Chip
          icon={<FireIcon />}
          label="By Streak"
          onClick={() => setCategory('streak')}
          color={category === 'streak' ? 'primary' : 'default'}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {/* Top 3 Podium */}
      {leaderboardData.length >= 3 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {/* 2nd Place */}
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ textAlign: 'center', pt: 4, pb: 2, bgcolor: '#f5f5f5' }}>
              <Badge badgeContent="2nd" color="secondary">
                <Avatar
                  src={leaderboardData[1]?.avatar}
                  sx={{ width: 80, height: 80, mx: 'auto', mb: 2, border: '4px solid #C0C0C0' }}
                >
                  {leaderboardData[1]?.name?.[0]}
                </Avatar>
              </Badge>
              <Typography variant="h6" fontWeight="600">{leaderboardData[1]?.name}</Typography>
              {getLevelBadge(leaderboardData[1]?.level)}
              <Typography variant="h5" color="primary" fontWeight="700" sx={{ mt: 2 }}>
                {category === 'points' && `${leaderboardData[1]?.points} pts`}
                {category === 'completed' && `${leaderboardData[1]?.completedCount} requests`}
                {category === 'streak' && `${leaderboardData[1]?.streak} days`}
              </Typography>
            </Card>
          </Grid>

          {/* 1st Place */}
          <Grid item xs={12} md={4}>
            <Card elevation={6} sx={{ textAlign: 'center', pt: 3, pb: 2, bgcolor: '#FFF9C4', position: 'relative' }}>
              <TrophyIcon sx={{ position: 'absolute', top: 8, right: 8, color: '#FFD700', fontSize: 32 }} />
              <Badge badgeContent="1st" color="primary">
                <Avatar
                  src={leaderboardData[0]?.avatar}
                  sx={{ width: 100, height: 100, mx: 'auto', mb: 2, border: '5px solid #FFD700' }}
                >
                  {leaderboardData[0]?.name?.[0]}
                </Avatar>
              </Badge>
              <Typography variant="h5" fontWeight="700">{leaderboardData[0]?.name}</Typography>
              {getLevelBadge(leaderboardData[0]?.level)}
              <Typography variant="h4" color="primary" fontWeight="700" sx={{ mt: 2 }}>
                {category === 'points' && `${leaderboardData[0]?.points} pts`}
                {category === 'completed' && `${leaderboardData[0]?.completedCount} requests`}
                {category === 'streak' && `${leaderboardData[0]?.streak} days`}
              </Typography>
              <Chip label="🏆 Champion" color="primary" sx={{ mt: 1, fontWeight: 700 }} />
            </Card>
          </Grid>

          {/* 3rd Place */}
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ textAlign: 'center', pt: 4, pb: 2, bgcolor: '#f5f5f5' }}>
              <Badge badgeContent="3rd" color="warning">
                <Avatar
                  src={leaderboardData[2]?.avatar}
                  sx={{ width: 80, height: 80, mx: 'auto', mb: 2, border: '4px solid #CD7F32' }}
                >
                  {leaderboardData[2]?.name?.[0]}
                </Avatar>
              </Badge>
              <Typography variant="h6" fontWeight="600">{leaderboardData[2]?.name}</Typography>
              {getLevelBadge(leaderboardData[2]?.level)}
              <Typography variant="h5" color="primary" fontWeight="700" sx={{ mt: 2 }}>
                {category === 'points' && `${leaderboardData[2]?.points} pts`}
                {category === 'completed' && `${leaderboardData[2]?.completedCount} requests`}
                {category === 'streak' && `${leaderboardData[2]?.streak} days`}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Full Leaderboard Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rank</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Level</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Points</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Completed</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Streak</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Trust Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <LinearProgress />
                </TableCell>
              </TableRow>
            ) : leaderboardData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">No data available</Typography>
                </TableCell>
              </TableRow>
            ) : (
              leaderboardData.map((user) => (
                <TableRow
                  key={user.id}
                  sx={{
                    bgcolor: user.id === userProfile?.uid ? 'action.selected' : 'inherit',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getRankIcon(user.rank)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={user.avatar} sx={{ width: 40, height: 40 }}>
                        {user.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography fontWeight="600">
                          {user.name}
                          {user.id === userProfile?.uid && (
                            <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.achievements?.length || 0} achievements
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{getLevelBadge(user.level)}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography fontWeight="600">{user.points}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={getProgressToNextLevel(user.points)}
                        sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<HeartIcon />}
                      label={user.completedCount}
                      size="small"
                      color="success"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<FireIcon />}
                      label={`${user.streak} days`}
                      size="small"
                      color={user.streak > 7 ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Trust score based on reliability and ratings">
                      <Chip
                        label={`${user.trustScore}%`}
                        size="small"
                        color={user.trustScore >= 90 ? 'success' : user.trustScore >= 70 ? 'warning' : 'error'}
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Info Box */}
      <Paper elevation={1} sx={{ p: 2, mt: 3, bgcolor: 'info.light' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <InfoIcon color="info" />
          <Box>
            <Typography variant="body2" fontWeight="600" gutterBottom>
              How Rankings Work
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • <strong>Points:</strong> Earned by completing requests and helping others<br />
              • <strong>Streak:</strong> Consecutive days of activity in the community<br />
              • <strong>Trust Score:</strong> Based on reliability, ratings, and completion rate<br />
              • <strong>Levels:</strong> Unlock new badges and privileges as you progress
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
