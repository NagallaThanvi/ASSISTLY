import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { exportStatisticsCSV } from '../../utils/communityStats';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#52b788', '#ff6b35', '#fdc500'];

const AdminOverview = ({ statistics, onRefresh }) => {
  if (!statistics) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading statistics...</Typography>
      </Box>
    );
  }

  const handleExport = () => {
    const csv = exportStatisticsCSV(statistics);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `community-stats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Prepare chart data
  const categoryData = Object.entries(statistics.requests.byCategory).map(([name, value]) => ({
    name,
    value
  }));

  const urgencyData = [
    { name: 'High', value: statistics.requests.byUrgency.high },
    { name: 'Medium', value: statistics.requests.byUrgency.medium },
    { name: 'Low', value: statistics.requests.byUrgency.low }
  ];

  const statusData = [
    { name: 'Open', value: statistics.requests.open },
    { name: 'Claimed', value: statistics.requests.claimed },
    { name: 'Completed', value: statistics.requests.completed },
    { name: 'Cancelled', value: statistics.requests.cancelled }
  ];

  return (
    <Box>
      {/* Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Community Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* User Statistics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Statistics
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Residents</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.users.residents} ({((statistics.users.residents / statistics.users.total) * 100).toFixed(0)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(statistics.users.residents / statistics.users.total) * 100}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Volunteers</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.users.volunteers} ({((statistics.users.volunteers / statistics.users.total) * 100).toFixed(0)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(statistics.users.volunteers / statistics.users.total) * 100}
                  sx={{ height: 8, borderRadius: 1 }}
                  color="success"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Both</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.users.both} ({((statistics.users.both / statistics.users.total) * 100).toFixed(0)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(statistics.users.both / statistics.users.total) * 100}
                  sx={{ height: 8, borderRadius: 1 }}
                  color="secondary"
                />
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  New users this month: <strong>{statistics.users.newThisMonth}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active users: <strong>{statistics.users.activeUsers}</strong>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Request Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Request Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Categories */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Request Categories
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Volunteers */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Volunteers
            </Typography>
            <List>
              {statistics.engagement.topVolunteers.map((volunteer, index) => (
                <ListItem key={volunteer.uid}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                      {index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={volunteer.name}
                    secondary={volunteer.email}
                  />
                  <Chip
                    icon={<StarIcon />}
                    label={`${volunteer.completedRequests} completed`}
                    color="primary"
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity Trends (Last 30 Days)
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Requests Created
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.trends.requestsLast30Days}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Requests Completed
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {statistics.trends.completedLast30Days}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      New Users
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {statistics.trends.newUsersLast30Days}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics.trends.dailyActivity.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#667eea" name="Created" />
                <Line type="monotone" dataKey="completed" stroke="#52b788" name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Engagement Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Engagement Metrics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" color="primary">
                    {statistics.engagement.completionRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" color="success.main">
                    {statistics.engagement.averageResponseTime}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Response Time
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" color="warning.main">
                    {statistics.engagement.activeVolunteers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Volunteers
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" color="error.main">
                    {statistics.requests.open}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open Requests
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminOverview;
