# Claude Code Instructions

## Setup Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
npm run deploy
```

## Firebase Configuration

Before running the app, you need to configure Firebase:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Copy the configuration and update `src/services/firebase.js`
5. **IMPORTANT**: Update Super Admin emails in:
   - `src/stores/superAdmin.js` (SUPER_ADMIN_EMAILS array)
   - `firestore.rules` (isSuperAdmin function)

## Key Features Implemented

- ✅ PWA with dark medical theme
- ✅ Firebase authentication (Polish UI)
- ✅ Ambulance creation with unique IDs
- ✅ QR code generation for easy joining
- ✅ Role-based access (admin/member)
- ✅ Inventory management with expiration tracking
- ✅ In-app notifications for expiring items
- ✅ Activity logging with user attribution
- ✅ Responsive design for mobile and desktop
- ✅ Offline PWA capabilities
- ✅ **Super Admin Dashboard** for app management

## Database Structure

```
users/{uid}
  - email, displayName, createdAt, ambulances[]

ambulances/{ambulanceId}
  - id, name, location, creator, admins[], members[], settings

ambulances/{ambulanceId}/inventory/{itemId}
  - name, quantity, unit, expirationDate, batchNumber, notes
  - addedBy, addedByName, addedAt, updatedAt, status

ambulances/{ambulanceId}/activities/{activityId}
  - type, userId, userName, details, timestamp, itemId
```

## Security Rules

The Firestore security rules ensure:
- Users can only access ambulances they're members of
- Only admins can modify inventory
- All members can read data and create activity logs
- Proper data validation and authorization

## Multi-Ambulance Workflow

The app is designed for ambulance workers who may work in different ambulances during different shifts:

### User Roles:
- **Creator**: First person creating ambulance (full permissions)
- **Admin**: Can manage inventory and members (assigned by creator/other admins)
- **Member**: Can view and update item status

### Typical Workflow:
1. **Start shift**: Scan ambulance QR code or enter ID to join as team member
2. **Work as team**: Check inventory, mark used medications
3. **Switch ambulances**: If working multiple ambulances, switch between them
4. **Notifications**: Get alerts for expiring items in all your ambulances

## Testing Checklist

### Basic Functionality:
- [ ] User registration and login
- [ ] Ambulance creation with unique ID
- [ ] QR code generation and manual joining
- [ ] Inventory management (add/edit/delete items)
- [ ] Expiration date monitoring and notifications
- [ ] Activity logging with user attribution

### Multi-Ambulance Features:
- [ ] Join multiple ambulances as member
- [ ] Role display (Creator/Admin/Member badges)
- [ ] Ambulance switcher when multiple ambulances
- [ ] Dashboard showing all user's ambulances
- [ ] Different permission levels working correctly
- [ ] Cross-ambulance notifications

### Role Management:
- [ ] Creator can assign admin roles
- [ ] Admins can manage inventory and members
- [ ] Members can view and update item status
- [ ] Role-based UI showing/hiding features

### Mobile & PWA:
- [ ] Mobile responsiveness
- [ ] PWA installation
- [ ] Offline functionality

### Super Admin Features:
- [ ] Super Admin dashboard access
- [ ] App statistics and overview
- [ ] All ambulances management
- [ ] User management (ban/unban)
- [ ] Cross-ambulance activity monitoring
- [ ] Data export functionality