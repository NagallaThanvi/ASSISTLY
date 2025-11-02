/**
 * Quick Fix Script for Empty Admin Profile
 * 
 * This script will:
 * 1. Find all communities
 * 2. For each community, update the admin's user document
 * 3. Add the communities field with admin role
 * 
 * Run: node fix-admin-profile.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Make sure you have serviceAccountKey.json in your project root
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Error: Could not find serviceAccountKey.json');
  console.error('Please download it from Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

const db = admin.firestore();

async function fixAdminProfiles() {
  console.log('🔧 Starting admin profile fix...\n');
  
  try {
    // Get all communities
    const communitiesSnapshot = await db.collection('communities').get();
    
    if (communitiesSnapshot.empty) {
      console.log('⚠️  No communities found. Create a community first!');
      return;
    }
    
    console.log(`📋 Found ${communitiesSnapshot.size} communities\n`);
    
    let fixed = 0;
    let errors = 0;
    
    for (const communityDoc of communitiesSnapshot.docs) {
      const community = communityDoc.data();
      const adminUid = community.admin;
      const communityId = communityDoc.id;
      const communityName = community.name || 'Unnamed Community';
      
      console.log(`\n📍 Processing: ${communityName} (${communityId})`);
      
      if (!adminUid) {
        console.log('   ⚠️  No admin UID found, skipping...');
        errors++;
        continue;
      }
      
      console.log(`   👤 Admin UID: ${adminUid}`);
      
      try {
        const userRef = db.collection('users').doc(adminUid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          console.log('   ⚠️  User document does not exist, creating...');
          
          // Try to get email from Firebase Auth
          let email = 'unknown@example.com';
          try {
            const authUser = await admin.auth().getUser(adminUid);
            email = authUser.email || email;
          } catch (authError) {
            console.log('   ⚠️  Could not fetch user from Auth');
          }
          
          await userRef.set({
            email: email,
            displayName: email.split('@')[0],
            communities: {
              [communityId]: 'admin'
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log('   ✅ Created user document with admin role');
          fixed++;
        } else {
          const userData = userDoc.data();
          
          if (userData.communities && userData.communities[communityId] === 'admin') {
            console.log('   ℹ️  Already has admin role, skipping...');
            continue;
          }
          
          await userRef.set({
            communities: {
              [communityId]: 'admin'
            }
          }, { merge: true });
          
          console.log('   ✅ Added admin role to existing user');
          fixed++;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✨ Fix complete!');
    console.log(`   Fixed: ${fixed} admins`);
    console.log(`   Errors: ${errors}`);
    console.log('='.repeat(50));
    
    if (fixed > 0) {
      console.log('\n✅ Your admin profile should now show members!');
      console.log('   Refresh your admin page to see the changes.');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
}

// Also fix all existing users to have communities field
async function fixAllUsers() {
  console.log('\n🔧 Fixing all existing users...\n');
  
  try {
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️  No users found.');
      return;
    }
    
    console.log(`📋 Found ${usersSnapshot.size} users\n`);
    
    let fixed = 0;
    let skipped = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      if (userData.communities) {
        skipped++;
        continue;
      }
      
      await userDoc.ref.update({
        communities: {}
      });
      
      console.log(`✅ Fixed user: ${userData.email || userId}`);
      fixed++;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✨ User fix complete!');
    console.log(`   Fixed: ${fixed} users`);
    console.log(`   Skipped: ${skipped} users (already had communities field)`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Error fixing users:', error);
  }
}

// Run both fixes
async function runAll() {
  await fixAdminProfiles();
  await fixAllUsers();
  process.exit(0);
}

runAll();
