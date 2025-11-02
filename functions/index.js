const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Create user document when a new user signs up
exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  try {
    const userRef = admin.firestore().collection('users').doc(user.uid);
    
    await userRef.set({
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      communities: {} // Initialize empty communities map
    });
    
    console.log(`User document created for ${user.uid}`);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});

// Update user's communities when membership is approved
exports.approveMembership = functions.firestore.document('membershipRequests/{requestId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Only proceed if the status changed to 'approved'
    if (beforeData.status !== 'approved' && afterData.status === 'approved') {
      const userId = afterData.userId;
      const communityId = afterData.communityId;

      const userRef = admin.firestore().collection('users').doc(userId);

      // Use set with merge to create document if it doesn't exist
      await userRef.set({
        communities: {
          [communityId]: 'member'
        }
      }, { merge: true });
      
      console.log(`User ${userId} added to community ${communityId}`);
    }
  });
