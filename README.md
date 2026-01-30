# Diamond Bidding System

A production-ready, real-world diamond auction platform built with Node.js, Express, React, and PostgreSQL.

## 🏗️ System Architecture

### Backend (Completed ✅)
- **Node.js + Express.js** - RESTful API server
- **PostgreSQL + Sequelize ORM** - Database with proper relationships
- **JWT Authentication** - Secure token-based auth with role-based access
- **Joi Validation** - Comprehensive input validation
- **bcrypt** - Password hashing
- **Helmet + CORS** - Security middleware

### Frontend (In Progress 🔄)
- **React + TypeScript** - Modern frontend framework
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Context API/Redux** - State management

## 📊 Database Schema

### Core Models
1. **Users** - Authentication and role management
2. **Diamonds** - Diamond catalog with base prices
3. **Bids** - Auction events with time windows
4. **UserBids** - Individual user bids
5. **BidHistory** - Complete audit trail of bid changes
6. **Results** - Auction results and winners

### Key Features
- ✅ Proper foreign key relationships
- ✅ Data integrity constraints
- ✅ Audit trail for all bid changes
- ✅ Time-based bid status management
- ✅ Role-based access control

## 🔐 Authentication & Authorization

### Roles
- **ADMIN** - Full system access
- **USER** - Bidding access only

### Security Features
- ✅ JWT token authentication
- ✅ Role-based route protection
- ✅ Password hashing with bcrypt
- ✅ Account activation/deactivation
- ✅ Token expiration handling

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/validate` - Validate token

### User Management (Admin Only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/toggle-status` - Activate/deactivate user
- `DELETE /api/users/:id` - Delete user

### Diamond Management (Coming Soon)
- Diamond CRUD operations
- Image uploads
- Price management

### Bid Management (Coming Soon)
- Create auction events
- Time-based status updates
- Bid monitoring

### User Bidding (Coming Soon)
- Place bids
- Edit bids (before end time)
- View bid history
- Real-time highest bid tracking

### Results (Coming Soon)
- Declare winners
- View auction results
- Winner notifications

## 🛠️ Installation & Setup

### Prerequisites
- Node.js >= 16.0.0
- PostgreSQL >= 12
- npm or yarn

### Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Database Setup
```bash
# Create PostgreSQL database
createdb diamond_bidding_system

# Run migrations (when implemented)
npm run migrate

# Seed test data (when implemented)
npm run seed
```

## 📋 Business Rules

### User Management
- ✅ Only ADMIN can manage users
- ✅ Users cannot change their own role
- ✅ Deactivated users cannot login or bid
- ✅ Email uniqueness enforced

### Bidding Rules (To Be Implemented)
- Users can only bid on ACTIVE auctions
- Bid amount must be >= baseBidPrice
- One bid per user per auction
- Bids become read-only after end time
- Every bid change creates history record

### Result Rules (To Be Implemented)
- Only admin can declare results
- Results can only be declared after end time
- Results can be declared only once
- Highest bid wins (calculated by backend)

## 🧪 Test Scenarios

### Test Data (To Be Created)
- 5 Users: User A, B, C, D, E
- 2 Diamonds: Royal Blue, Pink Diamond
- 2 Auction Events: 24-hour bidding windows
- Multiple bids per user
- Bid edit history tracking
- Result declaration workflow

### Validation Tests
- ✅ User registration and login
- ✅ Role-based access control
- ✅ Input validation with Joi
- ✅ Password security
- 🔄 Bid placement and validation
- 🔄 Bid editing with history
- 🔄 Result declaration
- 🔄 Winner determination

## 🔧 Development Workflow

### Phase 1: Backend Foundation ✅
- [x] Database schema design
- [x] Project structure setup
- [x] Sequelize models
- [x] Authentication system
- [x] User management APIs

### Phase 2: Core Bidding Logic 🔄
- [ ] Diamond management APIs
- [ ] Bid management APIs
- [ ] User bidding APIs
- [ ] Result declaration APIs

### Phase 3: Frontend Development ⏳
- [ ] React app setup
- [ ] Authentication components
- [ ] Admin dashboard
- [ ] User bidding interface
- [ ] Results viewing

### Phase 4: Testing & Deployment ⏳
- [ ] Test data creation
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Production deployment

## 📁 Project Structure

```
diamond-bidding-system/
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── validators/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── DATABASE_SCHEMA.md
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit your changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

