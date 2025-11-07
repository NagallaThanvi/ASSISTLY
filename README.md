# Assistly - Multi-Community Assistance Platform

A private, community-based platform where admins can create isolated community spaces for members to request and offer help. Each community is completely private with its own admin control.

## 🏘️ Platform Overview

**Assistly is a multi-community platform where:**
- Each community is **completely private and isolated**
- Every community has its own **admin** who manages members and activities
- Users can **only see and participate** in their own community
- Admins **approve/reject** all join requests
- No cross-community visibility or data sharing

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase

Create a `.env` file in the root directory:
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_GROQ_API_KEY=your-groq-key (optional, for AI chatbot)
```

### 3. Deploy Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Run Development Server
```bash
npm start
```

The app will open at `http://localhost:3001`

## 👑 Admin Setup

### Creating Your First Community

1. **Navigate to Admin Signup**
   - Go to `http://localhost:3001/admin-signup`
   
2. **Step 1: Create Admin Account**
   - Enter your name, email, and password
   - Click "Next: Setup Community"

3. **Step 2: Create Your Community**
   - Community Name: e.g., "Downtown Neighbors"
   - Description: Describe your community's purpose
   - Location: (Optional) e.g., "Seattle Downtown"
   - Click "Create Admin & Community"

4. **You're Done!** 🎉
   - You now have an admin account with `community_admin` role
   - Your private community is created
   - You're automatically assigned as the community admin

### Admin Features

✅ **Member Management**
- Approve/reject join requests
- View all community members
- Remove members if needed

✅ **Content Moderation**
- View all requests in your community
- Manage inappropriate content
- Access activity logs

✅ **Community Settings**
- Update community name and description
- Customize branding
- View statistics and analytics

✅ **Privacy Control**
- All communities are private by default
- Only approved members can see community data
- Complete isolation from other communities

## 👥 User Workflow

### 1. Sign Up
- Create an account at `/signup`
- No community assigned initially

### 2. Join a Community
- Browse available communities at `/communities`
- Click "Request to Join" on desired community
- Wait for admin approval

### 3. After Approval
- **Resident Mode**: Create help requests
- **Volunteer Mode**: Help others with their requests
- Chat with community members
- Earn points and achievements

## 🔒 Privacy & Security

### Community Isolation

**What members CAN see:**
- ✅ Requests within their community
- ✅ Other members in their community
- ✅ Community leaderboard and statistics
- ✅ Messages from community members

**What members CANNOT see:**
- ❌ Requests from other communities
- ❌ Members from other communities
- ❌ Activities in other communities
- ❌ Any data outside their community

### Firestore Security

All data is protected by Firestore security rules that enforce:
- Community-level data isolation
- Role-based access control
- Proper authentication checks
- Admin-only operations

## 📊 Key Features

### For Communities
- 🏘️ Private, isolated community spaces
- 👑 Admin-controlled member approval
- 📱 Real-time request updates
- 💬 In-community messaging
- 🎮 Gamification (points, levels, badges)
- 📊 Community analytics dashboard
- 🗺️ Map view of requests
- 🎨 Custom community branding

### For Members
- 🙋 Create help requests
- 🤝 Volunteer to help others
- ⭐ Rate completed interactions
- 🏆 Earn achievements and climb leaderboard
- 🔔 Real-time notifications
- 🤖 AI chatbot assistant (optional)
- 🎤 Voice input support

## 🏗️ Architecture

See [MULTI_COMMUNITY_ARCHITECTURE.md](./MULTI_COMMUNITY_ARCHITECTURE.md) for detailed technical documentation.

### Database Collections

```
communities/          # Community metadata
├── {communityId}
    ├── name
    ├── description
    ├── adminId       # Community admin
    ├── isPrivate     # Always true
    └── memberCount

users/                # User profiles
├── {userId}
    ├── communityId   # Primary community
    ├── role          # super_admin, community_admin, user
    └── communities   # Map of community memberships

requests/             # Help requests
├── {requestId}
    ├── communityId   # ⚠️ CRITICAL: Scopes request to community
    ├── createdByUid
    ├── status
    └── ...

join_requests/        # Pending join requests
├── {requestId}
    ├── userId
    ├── communityId
    └── status
```

## 🧪 Testing Checklist

Test the multi-community isolation:

- [ ] Create admin account + community
- [ ] Create second admin + second community
- [ ] User A joins Community 1
- [ ] User B joins Community 2
- [ ] Verify User A cannot see Community 2's requests
- [ ] Verify User B cannot see Community 1's members
- [ ] Admin A cannot manage Community 2
- [ ] Requests show only community members

## 🚢 Production Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Deploy to Firebase Hosting
```bash
firebase deploy
```

### 3. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### 4. Set Up First Super Admin (Optional)

If you need a super admin who can manage all communities:

1. Go to Firebase Console → Firestore
2. Open `users` collection
3. Find your user document
4. Add field: `role: "super_admin"`

## 📱 User Roles

| Role | Permissions |
|------|-------------|
| **super_admin** | Manage all communities, create new admins |
| **community_admin** | Full control over their community |
| **moderator** | Manage content, limited user management |
| **user** | Regular member (default) |

## 🛠️ Tech Stack

- **Frontend**: React 18 + Material-UI
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Maps**: Leaflet + React Leaflet
- **Charts**: Recharts
- **AI**: Groq API (optional)
- **Routing**: React Router v6

## 📝 License

MIT License - feel free to use for your community!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues or questions:
- Create an issue on GitHub
- Check [MULTI_COMMUNITY_ARCHITECTURE.md](./MULTI_COMMUNITY_ARCHITECTURE.md) for technical details

## 🌓 Dark mode (new)

We added a small, optional React component `DarkModeToggle` to make it easy to add a dark/light theme toggle to the app.

- File: `src/components/DarkModeToggle.js`
- What it does: toggles a `dark-mode` CSS class on the `<html>` element and persists the user's choice in `localStorage`.
- How to use:

    1. Import and place the toggle somewhere in your layout (e.g. in `src/App.js`):

    ```jsx
    import DarkModeToggle from './components/DarkModeToggle';

    function App() {
        return (
            <div>
                {/* place in header or settings */}
                <DarkModeToggle />
                {/* rest of app */}
            </div>
        );
    }
    ```

    2. Add styles for dark mode in your CSS. Example (add to `index.css` or `App.css`):

    ```css
    .dark-mode {
        --bg: #111;
        --text: #eee;
        background-color: var(--bg);
        color: var(--text);
    }

    /* You can scope defaults and use CSS variables throughout the app */
    body { background-color: white; color: #111; }
    .dark-mode body, .dark-mode .App { background-color: #111; color: #eee; }
    ```

    3. Start the app and click the toggle. Preference is remembered across sessions.

This component is intentionally minimal and opt-in; it doesn't change app CSS by itself — it only toggles the `dark-mode` class so you can style the site as you prefer.

---

**Remember**: This is a multi-community platform where **privacy and isolation** are key. Each community operates independently with its own admin control. 🏘️🔒

## 🔔 Notification Preferences

The platform now includes a comprehensive notification management system that allows users to:
- Customize email and push notification settings
- Control notifications for:
  - Request updates
  - Community announcements
  - Chat messages
  - Weekly digest emails
  
### Using the Notification Preferences Panel

To integrate the notification preferences panel in your community:

```jsx
import NotificationPreferencesPanel from './components/NotificationPreferencesPanel';

// In your component:
<NotificationPreferencesPanel />
```

The panel automatically loads and saves user preferences, providing a seamless experience for managing notifications. All preferences are stored securely and can be updated at any time.