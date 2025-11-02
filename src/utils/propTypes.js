/**
 * PropTypes definitions for components
 * Runtime type checking for component props
 */
import PropTypes from 'prop-types';

// User PropTypes
export const UserPropType = PropTypes.shape({
  uid: PropTypes.string.isRequired,
  email: PropTypes.string,
  displayName: PropTypes.string,
  photoURL: PropTypes.string,
  emailVerified: PropTypes.bool
});

// User Profile PropTypes
export const UserProfilePropType = PropTypes.shape({
  uid: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  displayName: PropTypes.string,
  role: PropTypes.oneOf(['user', 'moderator', 'community_admin', 'super_admin']),
  userType: PropTypes.oneOf(['resident', 'volunteer', 'both']),
  communityId: PropTypes.string,
  onboardingCompleted: PropTypes.bool,
  createdAt: PropTypes.object,
  updatedAt: PropTypes.object
});

// Request PropTypes
export const RequestPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  urgency: PropTypes.oneOf(['low', 'medium', 'high']).isRequired,
  status: PropTypes.oneOf(['open', 'claimed', 'pending_completion', 'completed', 'cancelled']).isRequired,
  location: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      address: PropTypes.string,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number
      })
    })
  ]),
  createdByUid: PropTypes.string.isRequired,
  createdBy: PropTypes.string,
  communityId: PropTypes.string,
  claimedByUid: PropTypes.string,
  claimedBy: PropTypes.string,
  completedByUid: PropTypes.string,
  contactInfo: PropTypes.string,
  estimatedTime: PropTypes.string,
  createdAt: PropTypes.object,
  timestamp: PropTypes.object,
  views: PropTypes.number,
  history: PropTypes.arrayOf(PropTypes.object)
});

// Community PropTypes
export const CommunityPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  location: PropTypes.string,
  memberCount: PropTypes.number,
  createdAt: PropTypes.object,
  adminIds: PropTypes.arrayOf(PropTypes.string)
});

// Message PropTypes
export const MessagePropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  requestId: PropTypes.string.isRequired,
  senderId: PropTypes.string.isRequired,
  senderEmail: PropTypes.string,
  senderName: PropTypes.string,
  receiverId: PropTypes.string.isRequired,
  receiverEmail: PropTypes.string,
  message: PropTypes.string.isRequired,
  createdAt: PropTypes.object,
  read: PropTypes.bool
});

// Notification PropTypes
export const NotificationPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  read: PropTypes.bool,
  createdAt: PropTypes.object,
  link: PropTypes.string
});

// Common PropTypes
export const ChildrenPropType = PropTypes.oneOfType([
  PropTypes.arrayOf(PropTypes.node),
  PropTypes.node
]);

export const OnClosePropType = PropTypes.func;
export const OnClickPropType = PropTypes.func;
export const OnChangePropType = PropTypes.func;
export const OnSubmitPropType = PropTypes.func;

// Location PropTypes
export const CoordinatesPropType = PropTypes.shape({
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired
});

export const LocationPropType = PropTypes.shape({
  address: PropTypes.string,
  coordinates: CoordinatesPropType
});

// Filter PropTypes
export const FiltersPropType = PropTypes.shape({
  searchTerm: PropTypes.string,
  category: PropTypes.string,
  urgency: PropTypes.string,
  status: PropTypes.string,
  sortBy: PropTypes.string
});

export default {
  UserPropType,
  UserProfilePropType,
  RequestPropType,
  CommunityPropType,
  MessagePropType,
  NotificationPropType,
  ChildrenPropType,
  OnClosePropType,
  OnClickPropType,
  OnChangePropType,
  OnSubmitPropType,
  CoordinatesPropType,
  LocationPropType,
  FiltersPropType
};
