import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Avatar,
  Tooltip,
  Paper,
  Divider,
  Badge
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Whatshot as FireIcon
} from '@mui/icons-material';
import {
  getGamificationProfile,
  calculateLevel,
  VOLUNTEER_LEVELS,
  MILESTONES
} from '../utils/gamification';
import { useAuth } from '../context/AuthContext';

const VolunteerGamification = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [nextLevel, setNextLevel] = useState(null);
  const [progressToNext, setProgressToNext] = useState(0);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const gamificationProfile = await getGamificationProfile(user.uid);
      setProfile(gamificationProfile);

      const level = calculateLevel(gamificationProfile.points);
      setCurrentLevel(level);

      // Find next level
      const levels = Object.values(VOLUNTEER_LEVELS).sort((a, b) => a.level - b.level);
      const nextLevelData = levels.find(l => l.level > level.level);
      setNextLevel(nextLevelData);

      // Calculate progress to next level
      if (nextLevelData) {
        const pointsInCurrentLevel = gamificationProfile.points - level.minPoints;
        const pointsNeededForNext = nextLevelData.minPoints - level.minPoints;
        const progress = (pointsInCurrentLevel / pointsNeededForNext) * 100;
        setProgressToNext(Math.min(progress, 100));
      } else {
        setProgressToNext(100);
      }
    } catch (error) {
      console.error('Error loading gamification profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return null;
  }

  const earnedAchievements = Object.values(MILESTONES).filter(m =>
    profile.achievements?.includes(m.id)
  );

  const availableAchievements = Object.values(MILESTONES).filter(m =>
    !profile.achievements?.includes(m.id)
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Level Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '2rem' }}>
                {currentLevel?.badge}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {currentLevel?.name}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Level {currentLevel?.level}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h4" fontWeight="bold">
                {profile.points}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Points
              </Typography>
            </Box>
          </Box>

          {nextLevel && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Progress to {nextLevel.name}
                </Typography>
                <Typography variant="body2">
                  {profile.points} / {nextLevel.minPoints}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressToNext}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white'
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <TrophyIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              {profile.requestsCompleted}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Requests Completed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              {profile.averageRating.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Rating
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <FireIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              {profile.streakDays}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Day Streak
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <TrendingIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              {earnedAchievements.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Achievements
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Earned Achievements */}
      {earnedAchievements.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrophyIcon color="primary" />
              Earned Achievements
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              {earnedAchievements.map((achievement) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  <Tooltip title={achievement.description}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <Typography variant="h3" sx={{ mb: 1 }}>
                        {achievement.icon}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {achievement.name}
                      </Typography>
                      <Chip
                        label={`+${achievement.points} pts`}
                        size="small"
                        color="primary"
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Available Achievements */}
      {availableAchievements.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🎯 Available Achievements
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              {availableAchievements.slice(0, 6).map((achievement) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  <Tooltip title={achievement.description}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        opacity: 0.6,
                        border: '2px dashed',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        '&:hover': {
                          opacity: 0.8
                        }
                      }}
                    >
                      <Typography variant="h3" sx={{ mb: 1, filter: 'grayscale(100%)' }}>
                        {achievement.icon}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
                        {achievement.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {achievement.description}
                      </Typography>
                      <Chip
                        label={`+${achievement.points} pts`}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default VolunteerGamification;
