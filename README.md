# CodecIT - Admin Portal Frontend

> **Human Resource Management System** - Admin Portal

A modern, full-featured HRM admin portal built with React, TypeScript, and TailwindCSS. This project provides comprehensive HR management capabilities including user management, attendance tracking, scheduling, leave management, and more.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Checklist](#development-checklist)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## 🎯 Overview

**CodecIT** is a comprehensive HR management solution designed to streamline:

- **User Management** - Employee profiles, roles, and permissions
- **Attendance Tracking** - Clock in/out, break management, live monitoring
- **Schedule Management** - Shift planning, conflict detection, confirmations
- **Leave Management** - Leave requests, approvals, balance tracking
- **Reimbursement Processing** - Expense claims with receipt uploads
- **Client Management** - Client assignments and billing
- **Reports & Analytics** - Attendance reports, timesheets, exports
- **Announcements** - Company-wide communications

**Project Duration:** 8 Weeks (2 Months)  
**Team Size:** 2 Fullstack Developers  
**Target Platforms:** Admin Portal (Web)

---

## 🛠 Technology Stack

### Core Technologies

| Technology          | Version | Purpose                 |
| ------------------- | ------- | ----------------------- |
| **React**           | 18.2+   | UI Framework            |
| **TypeScript**      | 5.0+    | Type Safety             |
| **Vite**            | 4.5+    | Build Tool & Dev Server |
| **Redux Toolkit**   | 1.9+    | Global State Management |
| **React Query**     | 5.0+    | Server State & Caching  |
| **React Router**    | 6.16+   | Client-side Routing     |
| **TailwindCSS**     | 4.1+    | Utility-First CSS       |
| **React Hook Form** | 7.47+   | Form Management         |
| **Yup**             | 1.3+    | Schema Validation       |
| **Axios**           | 1.5+    | HTTP Client             |
| **date-fns**        | 2.30+   | Date Utilities          |

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **React Hot Toast** - Toast notifications
- **React Window** - List virtualization

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd PulseOps-admin-portal-Frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CodecIT
```

---

## 📁 Project Structure

```
src/
├── assets/                 # Static assets (images, fonts)
├── components/             # Reusable components
│   ├── common/             # Generic UI components
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Table/
│   │   └── LoadingSpinner/
│   ├── layout/             # Layout components
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── features/           # Feature-specific components
│       ├── users/
│       ├── attendance/
│       ├── schedule/
│       ├── leave/
│       └── reimbursement/
├── pages/                  # Page components (routes)
│   ├── Dashboard/
│   ├── Users/
│   ├── Attendance/
│   ├── Schedule/
│   └── Leave/
├── hooks/                  # Custom React hooks
├── services/               # API services
├── store/                  # Redux store & slices
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── styles/                 # Global styles & theme
├── App.tsx
└── main.tsx
```

---

## ✅ Development Checklist

### PHASE 1: Foundation & Authentication (Week 1-2)

#### Week 1: Project Setup & Backend Foundation

**Environment Setup**

- [x] Initialize Git repository with proper .gitignore
- [x] Set up frontend Admin Portal project (React + Vite + TypeScript)
- [x] Set up ESLint + Prettier for frontend
- [x] Configure Axios interceptors for API calls
- [x] Admin Portal running on localhost
- [x] Code formatting working consistently

#### Week 2: Authentication Frontend & User Management

**Authentication Frontend (Day 6-7)**

- [ ] Create Login page UI (Admin Portal)
- [ ] Implement Redux auth slice for state management
- [ ] Create auth service for API calls
- [ ] Implement token storage (secure)
- [ ] Implement auto token refresh logic
- [ ] Create protected route wrapper component
- [ ] Implement logout functionality
- [ ] Create forgot password page
- [ ] Test complete login flow end-to-end

**User Management Frontend - Admin (Day 10)**

- [ ] Create Users list page with data table
- [ ] Implement pagination in user table
- [ ] Create Add User modal/page form
- [ ] Create Edit User modal/page form
- [ ] Implement user search and filters UI
- [ ] Create User profile view page
- [ ] Add delete/deactivate confirmation dialog
- [ ] Connect all components to Redux/API

**Phase 1 Deliverables:**

- [ ] Admin users can log in to Admin Portal
- [ ] Session persists on page refresh
- [ ] Auto-logout on token expiry
- [ ] Forgot password flow works
- [ ] Admin can view list of all users
- [ ] Admin can create new users
- [ ] Admin can edit user details
- [ ] Admin can deactivate users

---

### PHASE 2: Core Modules (Week 3-4)

#### Week 3: Schedule & Attendance

**Schedule Management Frontend - Admin (Day 13-14)**

- [ ] Create Schedule list/calendar view page
- [ ] Create Schedule creation form
- [ ] Implement shift assignment grid
- [ ] Create shift detail modal
- [ ] Implement publish schedule button
- [ ] Display conflict warnings
- [ ] Show confirmation status for each shift
- [ ] Connect to Redux and API

**Attendance Frontend - Admin (Day 16-17)**

- [ ] Create live attendance dashboard
- [ ] Show who's clocked in/out/on break
- [ ] Create attendance records table
- [ ] Implement date range filtering
- [ ] Create manual attendance entry form
- [ ] Create attendance correction dialog
- [ ] Display late arrival alerts
- [ ] Add export to Excel functionality

#### Week 4: Employee Portal Core

**Employee Portal - Dashboard & Attendance (Day 18-19)**

- [ ] Create Employee Dashboard layout
- [ ] Create sidebar navigation
- [ ] Create today's schedule widget
- [ ] Create leave balance widget
- [ ] Create Clock-in/Clock-out buttons
- [ ] Create break start/end buttons
- [ ] Show current status (clocked in, on break, etc.)
- [ ] Create attendance history page
- [ ] Create attendance calendar view

**Employee Portal - Schedule View (Day 20)**

- [ ] Create My Schedule page
- [ ] Display upcoming shifts in list view
- [ ] Display shifts in calendar view
- [ ] Create shift confirmation dialog
- [ ] Show shift details (client, location, time)

**Phase 2 Deliverables:**

- [ ] Admin can view all schedules
- [ ] Admin can create new schedules with shifts
- [ ] Conflicts shown before saving
- [ ] Schedules can be published
- [ ] Real-time attendance status visible
- [ ] Historical records viewable with filters
- [ ] Employee can see dashboard on login
- [ ] Employee can clock in/out
- [ ] Employee can view and confirm shifts

---

### PHASE 3: Extended Modules (Week 5-6)

#### Week 5: Leave Management

**Leave Management Frontend (Day 23-24)**

- [ ] Create Leave Requests list page (Admin)
- [ ] Create approval/rejection dialog
- [ ] Create Leave calendar view (Admin)
- [ ] Create Holiday management page (Admin)
- [ ] Create Leave Request form (Employee)
- [ ] Show leave balance on form (Employee)
- [ ] Create My Leave Requests page (Employee)
- [ ] Show request status with timeline (Employee)
- [ ] Create Holiday calendar view (Employee)

**Reimbursement Frontend (Day 26-27)**

- [ ] Create Reimbursements queue page (Admin)
- [ ] Create receipt image viewer modal
- [ ] Create approval/rejection dialog
- [ ] Create payment processing panel (Admin)
- [ ] Create Reimbursement form (Employee)
- [ ] Create receipt upload component
- [ ] Create My Claims page (Employee)
- [ ] Show claim status with details (Employee)

#### Week 6: Client Management & Announcements

**Client Management (Day 28-29)**

- [ ] Create Client list page (Admin)
- [ ] Create Client form (add/edit)
- [ ] Create employee assignment panel
- [ ] Display client billing info

**Announcements Module (Day 30)**

- [ ] Create Announcements page (Admin)
- [ ] Create Announcement composer form
- [ ] Create Announcement feed (Employee)
- [ ] Implement mark as read/acknowledge

**Phase 3 Deliverables:**

- [ ] Admin can view and approve/reject leaves
- [ ] Employee can submit leave requests
- [ ] Leave balance displayed
- [ ] Holiday calendar visible to all
- [ ] Admin can view and process claims
- [ ] Receipts viewable in modal
- [ ] Employee can submit claims
- [ ] Clients can be added and managed
- [ ] Employees can be assigned to clients
- [ ] Admin can create announcements
- [ ] Employees can see announcements

---

### PHASE 4: Integration, Reports & Polish (Week 7-8)

#### Week 7: Reports & Dashboard Analytics

**Dashboard Frontend (Day 31-32)**

- [ ] Create Admin Dashboard home page
- [ ] Add stats cards (clocked in, late, absent)
- [ ] Add pending approvals widget
- [ ] Add attendance trend chart
- [ ] Add quick action buttons
- [ ] Finalize Employee dashboard widgets

**Reports Module (Day 33-34)**

- [ ] Create Reports page (Admin)
- [ ] Create report filter form
- [ ] Add download button for exports
- [ ] Create employee performance summary

**Timesheets Module (Day 35)**

- [ ] Create Timesheet page (Admin)
- [ ] Show hours by employee by week

#### Week 8: Notifications, Settings & Polish

**Notifications & Settings (Day 36-37)**

- [ ] Create notification dropdown (Admin)
- [ ] Create notification dropdown (Employee)
- [ ] Create Settings page (Admin)
- [ ] Implement attendance policy config
- [ ] Implement leave policy config
- [ ] Create Audit Log page

**Employee Profile & Polish (Day 38-39)**

- [ ] Create Profile page (Employee)
- [ ] Create Edit Profile form (Employee)
- [ ] Implement change password (Employee)
- [ ] Add loading states to all pages
- [ ] Add error handling/toast messages
- [ ] Fix responsive issues
- [ ] Polish navigation and sidebar
- [ ] Add empty state components
- [ ] Final UI cleanup

**Integration Testing (Day 40-42)**

- [ ] End-to-end testing: User management flow
- [ ] End-to-end testing: Attendance flow
- [ ] End-to-end testing: Leave flow
- [ ] End-to-end testing: Reimbursement flow
- [ ] End-to-end testing: Schedule flow
- [ ] Cross-browser testing (Chrome, Firefox, Edge)
- [ ] Performance optimization
- [ ] Security review

**Phase 4 Deliverables:**

- [ ] Admin dashboard shows live stats
- [ ] Pending approvals count visible
- [ ] Charts display attendance trends
- [ ] Attendance reports generate correctly
- [ ] Leave reports generate correctly
- [ ] Excel export works
- [ ] In-app notifications working
- [ ] Settings page functional
- [ ] Employee profile editable
- [ ] Password change works
- [ ] Loading states everywhere
- [ ] Error messages user-friendly
- [ ] All major flows working end-to-end
- [ ] No critical bugs remaining
- [ ] Works on all major browsers

---

## 📚 Documentation

Detailed documentation is available in the `/docs` folder:

- **[Development Checklist](./docs/pulse-ops-2-month-development-checklist.md)** - Complete 2-month development timeline
- **[Frontend Guidelines](./docs/pulse-ops-frontend-guidelines.md)** - Coding standards, patterns, and best practices
- **[Admin Dashboard Prototype](./docs/Pulse_Ops_Admin_Dashboard_Prototype.html)** - UI/UX prototype

### Key Guidelines

- **Component Structure**: Functional components with TypeScript
- **State Management**: Redux for global state, React Query for server state
- **Styling**: TailwindCSS with custom design tokens
- **Forms**: React Hook Form + Yup validation
- **Code Quality**: ESLint + Prettier + TypeScript strict mode
- **Testing**: Unit tests for components, E2E tests for critical flows

---

## 🤝 Contributing

### Branch Naming Convention

```
feature/user-management     # New features
bugfix/login-error          # Bug fixes
hotfix/critical-security    # Urgent production fixes
refactor/auth-module        # Code refactoring
```

### Commit Message Format

```
feat: Add user management module
fix: Fix login authentication bug
docs: Update API documentation
style: Format code with Prettier
refactor: Extract auth logic to custom hook
test: Add unit tests for UserCard
chore: Update dependencies
```

### Before Submitting PR

- [ ] Code compiles without errors
- [ ] No TypeScript errors or warnings
- [ ] ESLint passes with no errors
- [ ] All console.logs removed
- [ ] No hardcoded values (use constants)
- [ ] Component has proper types
- [ ] No unused imports or variables

---

## 📄 License

This project is proprietary and confidential.

---

## 👥 Team

**Development Team:** 2 Fullstack Developers  
**Project Duration:** 8 Weeks (2 Months)  
**Working Hours:** 8 hours/day, 5 days/week

---

**Built with ❤️ using React + TypeScript + Vite**
