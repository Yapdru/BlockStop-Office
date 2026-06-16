# BlockStop-Office Enterprise Application

A production-ready enterprise application for IT security management, policy administration, and audit logging.

## Features

### 1. Authentication & SSO
- **SAML 2.0 Support**: Enterprise single sign-on with SAML protocol
- **OAuth2 Integration**: Google and Microsoft OAuth support
- **Session Management**: Secure session handling with configurable timeouts
- **Admin Role-Based Access Control**: Role-based access control (Admin, Manager, User)

### 2. Admin Dashboard
- **Organization Overview**: Multi-tenant organization management
- **User Statistics**: Real-time user metrics and analytics
- **Security Alerts**: Aggregated threat detection and alerts
- **System Health Status**: Real-time system monitoring

### 3. User Management
- **CRUD Operations**: Create, read, update, delete users
- **Bulk User Import**: Import users from CSV files
- **Role Assignment**: Assign admin, manager, or user roles
- **Department/Team Assignment**: Organize users by department and team
- **Two-Factor Authentication**: Optional 2FA enforcement

### 4. Policy Management
- **Security Policies**: Password requirements, 2FA enforcement, session policies
- **VPN Policies**: Provider restrictions, data usage limits
- **Scan Policies**: Scheduled scanning with frequency controls
- **DLP Rules**: Data Loss Prevention with pattern matching and actions

### 5. Audit Logging
- **Comprehensive Logging**: All admin actions logged automatically
- **User Activity Tracking**: Login/logout and activity tracking
- **Policy Change Tracking**: Full change history with before/after values
- **Threat Event Aggregation**: Centralized threat detection
- **Export Capabilities**: Export logs as CSV or JSON

### 6. Organization Management
- **Multi-Tenant Support**: Manage multiple organizations
- **Subscription Management**: Support for Starter, Professional, Enterprise tiers
- **Department Structure**: Hierarchical department organization
- **Team Management**: Team creation and member assignment

## Technology Stack

- **Framework**: Next.js 15 with React 18
- **Language**: TypeScript 5
- **Database**: PostgreSQL 13+
- **Authentication**: NextAuth.js
- **UI Components**: React with Framer Motion animations
- **Styling**: Tailwind CSS with custom light blue theme
- **UI Icons**: Lucide React

## Project Structure

```
BlockStop-Office/
├── app/                          # Next.js app directory
│   ├── (admin)/                  # Admin routes group
│   │   ├── dashboard/page.tsx    # Admin dashboard
│   │   ├── users/page.tsx        # User management
│   │   ├── policies/page.tsx     # Policy management
│   │   ├── audit-logs/page.tsx   # Audit log viewer
│   │   ├── organizations/page.tsx # Organization management
│   │   └── settings/page.tsx     # System settings
│   ├── (auth)/                   # Authentication routes group
│   │   ├── login/page.tsx        # Login page
│   │   └── sso/                  # SSO callback routes
│   ├── api/                      # API endpoints
│   │   ├── health/               # Health check endpoint
│   │   ├── admin/                # Admin API endpoints
│   │   └── audit/                # Audit API endpoints
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page redirect
│   └── providers.tsx             # React providers
├── components/                   # Reusable components
│   ├── admin-header.tsx          # Admin header component
│   ├── sidebar.tsx               # Navigation sidebar
│   └── audit-log-viewer.tsx      # Audit log viewer component
├── lib/                          # Utility libraries
│   ├── db.ts                     # Database connection pool
│   ├── auth/                     # Authentication utilities
│   │   ├── sso-service.ts        # SSO service
│   │   └── admin-guard.ts        # Admin authentication guard
│   ├── admin/                    # Admin business logic
│   │   ├── user-manager.ts       # User management
│   │   ├── policy-manager.ts     # Policy management
│   │   └── organization-manager.ts # Organization management
│   └── audit/                    # Audit logging
│       └── audit-logger.ts       # Audit logger service
├── types/                        # TypeScript type definitions
│   ├── admin.ts                  # Admin types
│   ├── organization.ts           # Organization types
│   └── audit.ts                  # Audit types
├── blockos/                      # Database scripts
│   └── init-db-enterprise.sql   # Database initialization
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── next.config.js                # Next.js configuration
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### 1. Clone the Repository
```bash
cd /home/user/BlockStop-Office
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
DATABASE_URL=postgresql://user:password@localhost:5432/blockstop_office
NEXTAUTH_SECRET=your-secret-key-here-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# SAML Configuration
SAML_ENTRY_POINT=https://your-idp.example.com/app/123/sso/saml
SAML_ISSUER=blockstop-office

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

### 4. Setup Database
```bash
npm run db:setup
```

This runs the SQL schema initialization with:
- Organizations, Departments, Teams, Users tables
- Security, VPN, Scan, and DLP Policy tables
- Audit logs and Threat events tracking
- Organization settings and Sessions

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000/auth/login` to access the application.

## API Endpoints

### Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

### Users
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user

### Policies
- `GET /api/admin/policies` - List policies (with optional type filter)
- `POST /api/admin/policies` - Create policy

### Organizations
- `GET /api/admin/organizations` - List organizations
- `POST /api/admin/organizations` - Create organization

### Audit Logs
- `GET /api/audit/logs` - List audit logs
- `GET /api/audit/logs/export` - Export logs as CSV or JSON

### Settings
- `GET /api/admin/settings` - Get organization settings
- `PUT /api/admin/settings` - Update organization settings

### Health
- `GET /api/health` - System health check

## Database Schema

### Core Tables
- **organizations**: Multi-tenant organizations
- **users**: System users with roles and authentication
- **departments**: Hierarchical department structure
- **teams**: Team organization within departments

### Policy Tables
- **security_policies**: Authentication and session policies
- **vpn_policies**: VPN provider and usage policies
- **scan_policies**: Security scanning policies
- **dlp_rules**: Data Loss Prevention rules

### Audit & Security Tables
- **audit_logs**: Comprehensive audit trail
- **threat_events**: Security threat detection
- **sessions**: User session management
- **organization_settings**: Per-organization configurations

## Security Features

### Authentication
- NextAuth.js session management
- SAML 2.0 enterprise SSO
- OAuth2 provider integration
- Secure password hashing

### Authorization
- Role-based access control (RBAC)
- Organization-based isolation
- Admin guard middleware

### Audit & Compliance
- Comprehensive audit logging
- Change tracking with before/after values
- User activity tracking
- Login/logout monitoring
- Threat event aggregation
- 90-day retention with automatic cleanup

### Data Protection
- PostgreSQL with encrypted connections
- Environment variable secrets
- HTTPS support in production
- CSRF protection
- XSS prevention

## Environment Variables

### Database
- `DATABASE_URL`: PostgreSQL connection string
- `DATABASE_POOL_SIZE`: Connection pool size (default: 20)
- `DATABASE_TIMEOUT`: Connection timeout in ms (default: 5000)

### Authentication
- `NEXTAUTH_SECRET`: Session encryption secret (min 32 chars)
- `NEXTAUTH_URL`: Application URL

### SAML
- `SAML_ENTRY_POINT`: Identity provider endpoint
- `SAML_ISSUER`: Service provider identifier
- `SAML_CERT`: Certificate for signature verification

### OAuth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET`: Microsoft OAuth credentials

### Admin
- `ADMIN_EMAIL`: Initial admin email
- `ADMIN_PASSWORD_HASH`: Admin password hash

### Application
- `NODE_ENV`: Environment (development/production)
- `PORT`: Application port (default: 3000)
- `LOG_LEVEL`: Logging level

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build
```bash
npm run build
```

### Production Start
```bash
npm start
```

## Performance Optimizations

- Database connection pooling
- Query result caching
- Image optimization with Next.js
- Code splitting and lazy loading
- CSS minification with Tailwind
- API route caching

## Monitoring & Logging

### Audit Logging
All administrative actions are logged with:
- User ID and timestamp
- Resource changes (before/after)
- IP address and user agent
- Success/failure status
- Error messages

### System Health
- Database connectivity monitoring
- Error rate tracking
- Uptime monitoring
- Resource usage tracking

## Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup for Production
1. Set `NODE_ENV=production`
2. Use strong `NEXTAUTH_SECRET`
3. Enable HTTPS
4. Configure database backups
5. Set up monitoring and alerting
6. Configure audit log retention

## Support

For issues and questions, contact the development team or file an issue in the repository.

## License

Proprietary - All rights reserved

## Changelog

### Version 1.0.0
- Initial release
- Multi-tenant architecture
- Complete user management
- Policy management suite
- Comprehensive audit logging
- SSO/OAuth integration
- Enterprise-grade security
