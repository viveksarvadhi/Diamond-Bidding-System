# Diamond Bidding System - API Documentation

## 🚀 Backend API Complete!

The Diamond Bidding System backend is now fully implemented with all core functionality. Here's the complete API documentation:

## 🔐 Authentication Endpoints

### POST /api/auth/register
Register a new user (public)
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123",
  "role": "USER" // optional, defaults to USER
}
```

### POST /api/auth/login
User login (public)
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### GET /api/auth/profile
Get current user profile (authenticated)
- Headers: `Authorization: Bearer <token>`

### POST /api/auth/logout
Logout user (authenticated)

### GET /api/auth/validate
Validate JWT token (authenticated)

## 👥 User Management (Admin Only)

### GET /api/users
List all users with pagination
- Query: `page`, `limit`, `search`, `role`

### GET /api/users/:id
Get user by ID

### POST /api/users
Create new user

### PUT /api/users/:id
Update user

### PATCH /api/users/:id/toggle-status
Activate/deactivate user

### DELETE /api/users/:id
Delete user

## 💎 Diamond Management

### GET /api/diamonds
List all diamonds (public)
- Query: `page`, `limit`, `search`, `sortBy`, `sortOrder`

### GET /api/diamonds/:id
Get diamond by ID (public)

### POST /api/diamonds
Create new diamond (Admin only)

### PUT /api/diamonds/:id
Update diamond (Admin only)

### DELETE /api/diamonds/:id
Delete diamond (Admin only)

### GET /api/diamonds/:id/stats
Get diamond statistics (Admin only)

## 🎯 Bid Management (Admin Only)

### GET /api/bids
List all bids with full details

### GET /api/bids/active
List active bids (public)

### GET /api/bids/:id
Get bid by ID with full details

### POST /api/bids
Create new bid
```json
{
  "diamondId": 1,
  "baseBidPrice": 10000.00,
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T18:00:00Z"
}
```

### PUT /api/bids/:id
Update bid (DRAFT only)

### PATCH /api/bids/:id/activate
Activate bid (DRAFT to ACTIVE)

### DELETE /api/bids/:id
Delete bid (DRAFT only)

### GET /api/bids/:id/stats
Get bid statistics

## 🤝 User Bidding

### GET /api/user-bids/my-bids
Get current user's bids (authenticated)
- Query: `page`, `limit`, `status`

### GET /api/user-bids/:id/history
Get bid history for specific user bid (authenticated)

### POST /api/user-bids
Place new bid (authenticated users only)
```json
{
  "bidId": 1,
  "amount": 15000.00
}
```

### PUT /api/user-bids/:id
Edit existing bid (authenticated users only)
```json
{
  "amount": 16000.00
}
```

### DELETE /api/user-bids/:id
Delete user bid (before bidding ends)

### GET /api/user-bids/bid/:bidId/highest
Get highest bid for specific bid (public)

### GET /api/user-bids/bid/:bidId/all
Get all bids for specific bid (Admin only)

## 🏆 Result Management

### GET /api/results
List all results (Admin only)

### GET /api/results/my-results
Get current user's results (authenticated)

### GET /api/results/:id
Get result by ID (public)

### POST /api/results
Declare result (Admin only)
```json
{
  "bidId": 1
}
```

### GET /api/results/bid/:bidId/summary
Get bid summary before declaring result (Admin only)

### GET /api/results/stats/overview
Get result statistics (Admin only)

### DELETE /api/results/:id
Delete result (Admin only, emergency use)

## 🔒 Business Rules Implemented

### Authentication & Authorization
✅ JWT token-based authentication
✅ Role-based access control (ADMIN/USER)
✅ Account activation/deactivation
✅ Secure password hashing

### Diamond Management
✅ Only admin can manage diamonds
✅ Cannot update diamonds with active bids
✅ Cannot delete diamonds with existing bids

### Bid Management
✅ Time-based status management (DRAFT → ACTIVE → CLOSED)
✅ Only DRAFT bids can be edited/deleted
✅ No overlapping bid times for same diamond
✅ Auto status updates based on time

### User Bidding
✅ Users can only bid on ACTIVE auctions
✅ Bid amount must be ≥ baseBidPrice
✅ One bid per user per auction
✅ Bids become read-only after end time
✅ Complete bid history tracking

### Result Declaration
✅ Only admin can declare results
✅ Only after bid end time
✅ Only once per bid
✅ Highest bid wins (backend calculated)
✅ Complete audit trail

## 🧪 Test Scenarios Ready

### Required Test Data
- ✅ 5 Users: User A, B, C, D, E
- ✅ 2 Diamonds: Royal Blue, Pink Diamond  
- ✅ 2 Auction Events: 24-hour bidding windows
- ✅ Multiple bids per user
- ✅ Bid edit history tracking
- ✅ Result declaration workflow

### Validation Tests
- ✅ User registration and login
- ✅ Role-based access control
- ✅ Input validation with Joi
- ✅ Password security
- ✅ Bid placement and validation
- ✅ Bid editing with history
- ✅ Result declaration
- ✅ Winner determination

## 🎯 Key Features

### Security
- JWT authentication with expiration
- Role-based route protection
- Input validation and sanitization
- SQL injection prevention
- Password hashing with bcrypt

### Data Integrity
- Sequelize model validations
- Database constraints
- Transaction safety
- Audit trails
- Cascade deletes

### Performance
- Database indexing
- Efficient queries
- Pagination support
- Optimized associations

### Business Logic
- Time-based bid management
- Automatic status updates
- Highest bid calculation
- Complete bid history
- Result validation

## 🚀 Ready for Frontend

The backend is now complete and ready for frontend integration. All APIs are:
- ✅ Fully implemented
- ✅ Properly validated
- ✅ Secure and authenticated
- ✅ Well documented
- ✅ Production-ready

### Next Steps
1. Set up React frontend
2. Implement authentication components
3. Build admin dashboard
4. Create user bidding interface
5. Add result viewing

The Diamond Bidding System backend is enterprise-ready! 🎉
