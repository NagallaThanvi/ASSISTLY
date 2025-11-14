import React, { useState, useEffect } from 'react';
import {
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  LocationCity as CityIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getCommunityById } from '../utils/communityUtils';

const CommunityBadge = () => {
  const { communityId } = useAuth();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCommunity = async () => {
      if (!communityId) {
        setLoading(false);
        return;
      }

      try {
        const communityData = await getCommunityById(communityId);
        setCommunity(communityData);
      } catch (error) {
        console.error('Error loading community:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCommunity();
  }, [communityId]);

  if (loading) {
    return <CircularProgress size={20} sx={(theme) => ({ color: theme.palette.mode === 'dark' ? 'white' : theme.palette.primary.main })} />;
  }

  if (!community) {
    return null;
  }

  return (
    <Tooltip title={`${community.description || 'Your community'}`}>
      <Chip
        icon={<CityIcon />}
        label={community.name}
        size="small"
        sx={(theme) => ({
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : alpha(theme.palette.primary.main, 0.12),
          color: theme.palette.mode === 'dark' ? 'white' : theme.palette.primary.main,
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: theme.palette.mode === 'dark' ? 'white' : theme.palette.primary.main
          },
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : alpha(theme.palette.primary.main, 0.2)
          }
        })}
      />
    </Tooltip>
  );
};

export default CommunityBadge;
