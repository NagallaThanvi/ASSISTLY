import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';

/**
 * Default branding configuration
 */
export const DEFAULT_BRANDING = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#f093fb',
    background: '#ffffff',
    text: '#333333'
  },
  logo: null,
  banner: null,
  tagline: 'Connecting neighbors who care',
  welcomeMessage: 'Welcome to our community!',
  customCSS: '',
  theme: 'light' // 'light' or 'dark'
};

/**
 * Get community branding
 */
export const getCommunityBranding = async (communityId) => {
  try {
    const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId);
    const communityDoc = await getDoc(communityRef);
    
    if (communityDoc.exists()) {
      const data = communityDoc.data();
      return {
        ...DEFAULT_BRANDING,
        ...data.branding
      };
    }
    
    return DEFAULT_BRANDING;
  } catch (error) {
    console.error('Error fetching community branding:', error);
    return DEFAULT_BRANDING;
  }
};

/**
 * Update community branding
 */
export const updateCommunityBranding = async (communityId, brandingData) => {
  try {
    const communityRef = doc(db, COLLECTIONS.COMMUNITIES, communityId);
    
    await updateDoc(communityRef, {
      branding: brandingData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating community branding:', error);
    throw error;
  }
};

/**
 * Generate CSS from branding configuration
 */
export const generateBrandingCSS = (branding) => {
  const { colors, customCSS } = branding;
  
  return `
    :root {
      --community-primary: ${colors.primary};
      --community-secondary: ${colors.secondary};
      --community-accent: ${colors.accent};
      --community-background: ${colors.background};
      --community-text: ${colors.text};
    }
    
    .community-branded {
      --primary-color: ${colors.primary};
      --secondary-color: ${colors.secondary};
    }
    
    .community-header {
      background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
    }
    
    .community-button-primary {
      background: ${colors.primary};
      color: white;
    }
    
    .community-button-primary:hover {
      background: ${colors.secondary};
    }
    
    ${customCSS || ''}
  `;
};

/**
 * Apply branding to theme
 */
export const applyBrandingToTheme = (baseTheme, branding) => {
  return {
    ...baseTheme,
    palette: {
      ...baseTheme.palette,
      primary: {
        main: branding.colors.primary,
      },
      secondary: {
        main: branding.colors.secondary,
      },
      background: {
        default: branding.colors.background,
        paper: branding.colors.background,
      },
      text: {
        primary: branding.colors.text,
      },
    },
  };
};

/**
 * Validate branding configuration
 */
export const validateBranding = (branding) => {
  const errors = [];
  
  // Validate colors
  if (branding.colors) {
    const colorFields = ['primary', 'secondary', 'accent', 'background', 'text'];
    colorFields.forEach(field => {
      if (branding.colors[field] && !isValidColor(branding.colors[field])) {
        errors.push(`Invalid color format for ${field}`);
      }
    });
  }
  
  // Validate URLs
  if (branding.logo && !isValidURL(branding.logo)) {
    errors.push('Invalid logo URL');
  }
  
  if (branding.banner && !isValidURL(branding.banner)) {
    errors.push('Invalid banner URL');
  }
  
  // Validate text lengths
  if (branding.tagline && branding.tagline.length > 100) {
    errors.push('Tagline must be 100 characters or less');
  }
  
  if (branding.welcomeMessage && branding.welcomeMessage.length > 500) {
    errors.push('Welcome message must be 500 characters or less');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Check if string is valid hex color
 */
const isValidColor = (color) => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

/**
 * Check if string is valid URL
 */
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Preset color schemes
 */
export const COLOR_PRESETS = {
  default: {
    name: 'Default Purple',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      background: '#ffffff',
      text: '#333333'
    }
  },
  ocean: {
    name: 'Ocean Blue',
    colors: {
      primary: '#0077be',
      secondary: '#00a8e8',
      accent: '#00d4ff',
      background: '#ffffff',
      text: '#1a1a1a'
    }
  },
  forest: {
    name: 'Forest Green',
    colors: {
      primary: '#2d6a4f',
      secondary: '#40916c',
      accent: '#52b788',
      background: '#ffffff',
      text: '#1b4332'
    }
  },
  sunset: {
    name: 'Sunset Orange',
    colors: {
      primary: '#ff6b35',
      secondary: '#f7931e',
      accent: '#fdc500',
      background: '#ffffff',
      text: '#2d2d2d'
    }
  },
  midnight: {
    name: 'Midnight Dark',
    colors: {
      primary: '#5e60ce',
      secondary: '#7209b7',
      accent: '#f72585',
      background: '#1a1a2e',
      text: '#eaeaea'
    }
  },
  cherry: {
    name: 'Cherry Blossom',
    colors: {
      primary: '#ff006e',
      secondary: '#fb5607',
      accent: '#ffbe0b',
      background: '#ffffff',
      text: '#2d2d2d'
    }
  }
};

/**
 * Get branding preview HTML
 */
export const getBrandingPreview = (branding) => {
  return `
    <div style="
      background: linear-gradient(135deg, ${branding.colors.primary} 0%, ${branding.colors.secondary} 100%);
      padding: 20px;
      border-radius: 8px;
      color: white;
      text-align: center;
    ">
      ${branding.logo ? `<img src="${branding.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;" />` : ''}
      <h2 style="margin: 10px 0;">${branding.tagline || 'Community Tagline'}</h2>
      <p style="margin: 10px 0; opacity: 0.9;">${branding.welcomeMessage || 'Welcome message'}</p>
    </div>
  `;
};
