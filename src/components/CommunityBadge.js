import React, { useState, useEffect } from 'react';
import {
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
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
    return <CircularProgress size={20} sx={{ color: 'white' }} />;
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
        sx={{
          bgcolor: 'rgba(255,255,255,0.2)',
          color: 'white',
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: 'white'
          },
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.3)'
          }
        }}
      />
    </Tooltip>
  );
};

export default CommunityBadge;
