# Pulse Ops - 2-Month Development Checklist

## Overview

**Project Duration:** 8 Weeks (2 Months)
**Team Size:** 2 Fullstack Developers
**Working Hours:** 8 hours/day, 5 days/week
**Total Available:** 88 developer-days (44 days x 2 developers)
**Target Platforms:** Admin Dashboard + Employee Web Portal (React.js)

---

## Executive Summary

| Phase   | Duration | Developer Days | Focus Area                                      |
| ------- | -------- | -------------- | ----------------------------------------------- |
| Phase 1 | Week 1-2 | 20 days        | Foundation & Authentication                     |
| Phase 2 | Week 3-4 | 20 days        | Core Modules (Users, Schedule, Attendance)      |
| Phase 3 | Week 5-6 | 20 days        | Extended Modules (Leave, Reimbursement, Client) |
| Phase 4 | Week 7-8 | 28 days        | Integration, Reports, Polish & Testing          |

---

## Week-by-Week Breakdown

---

## PHASE 1: FOUNDATION & AUTHENTICATION (Week 1-2)

### Week 1: Project Setup & Backend Foundation

#### Day 1-2: Environment Setup (4 developer-days)

| Task                                                         | Developer | Days | Status |
| ------------------------------------------------------------ | --------- | ---- | ------ |
| Initialize Git repository with proper .gitignore             | Dev 1     | 0.25 | ☐      |
| Set up backend project structure (Node.js + Express)         | Dev 1     | 0.5  | ☐      |
| Set up frontend Admin project (React + Vite + TypeScript)    | Dev 2     | 0.5  | ☐      |
| Set up frontend Employee project (React + Vite + TypeScript) | Dev 2     | 0.5  | ☐      |
| Configure Docker Compose for MongoDB + Redis                 | Dev 1     | 0.5  | ☐      |
| Set up ESLint + Prettier for both frontend and backend       | Dev 2     | 0.5  | ☐      |
| Create environment configuration files (.env.example)        | Dev 1     | 0.25 | ☐      |
| Set up Postman/Insomnia collection structure                 | Dev 1     | 0.5  | ☐      |
| Configure Axios interceptors for API calls                   | Dev 2     | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] All repositories initialized with proper structure
- [ ] Docker containers running (MongoDB, Redis)
- [ ] Both frontend apps running on localhost
- [ ] Backend server running with health check endpoint
- [ ] Code formatting working consistently

---

#### Day 3-4: Database & Core Backend Setup (4 developer-days)

| Task                                         | Developer | Days | Status |
| -------------------------------------------- | --------- | ---- | ------ |
| Create MongoDB connection configuration      | Dev 1     | 0.25 | ☐      |
| Create Redis connection configuration        | Dev 1     | 0.25 | ☐      |
| Define User schema/model with all fields     | Dev 1     | 0.5  | ☐      |
| Define Attendance schema/model               | Dev 1     | 0.5  | ☐      |
| Define Schedule schema/model                 | Dev 2     | 0.5  | ☐      |
| Define LeaveRequest schema/model             | Dev 2     | 0.5  | ☐      |
| Define Reimbursement schema/model            | Dev 1     | 0.5  | ☐      |
| Define Client schema/model                   | Dev 2     | 0.5  | ☐      |
| Create database indexes as per specification | Dev 1     | 0.5  | ☐      |
| Set up Winston logger with log rotation      | Dev 2     | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] All 10+ MongoDB schemas created
- [ ] Database indexes configured
- [ ] Logging system working
- [ ] Redis connected and tested

---

#### Day 5: Authentication Backend (2 developer-days)

| Task                                              | Developer | Days | Status |
| ------------------------------------------------- | --------- | ---- | ------ |
| Implement password hashing utility (bcrypt)       | Dev 1     | 0.25 | ☐      |
| Implement JWT token generation (access + refresh) | Dev 1     | 0.5  | ☐      |
| Create auth middleware for route protection       | Dev 1     | 0.25 | ☐      |
| Implement POST /api/auth/login endpoint           | Dev 1     | 0.5  | ☐      |
| Implement POST /api/auth/logout endpoint          | Dev 2     | 0.25 | ☐      |
| Implement POST /api/auth/refresh-token endpoint   | Dev 2     | 0.5  | ☐      |
| Implement IP whitelist verification               | Dev 2     | 0.5  | ☐      |
| Store sessions in Redis                           | Dev 1     | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] Login/logout working via Postman
- [ ] JWT tokens generated correctly
- [ ] Session stored in Redis
- [ ] Protected routes return 401 without token

---

### Week 2: Authentication Frontend & User Management

#### Day 6-7: Authentication Frontend (4 developer-days)

| Task                                            | Developer | Days | Status |
| ----------------------------------------------- | --------- | ---- | ------ |
| Create Login page UI (Admin Dashboard)          | Dev 1     | 0.5  | ☐      |
| Create Login page UI (Employee Portal)          | Dev 2     | 0.5  | ☐      |
| Implement Redux auth slice for state management | Dev 1     | 0.5  | ☐      |
| Create auth service for API calls               | Dev 1     | 0.25 | ☐      |
| Implement token storage (secure)                | Dev 2     | 0.25 | ☐      |
| Implement auto token refresh logic              | Dev 1     | 0.5  | ☐      |
| Create protected route wrapper component        | Dev 2     | 0.5  | ☐      |
| Implement logout functionality                  | Dev 2     | 0.25 | ☐      |
| Create forgot password page                     | Dev 1     | 0.5  | ☐      |
| Implement forgot password API endpoint          | Dev 2     | 0.5  | ☐      |
| Test complete login flow end-to-end             | Both      | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] Users can log in to Admin Dashboard
- [ ] Users can log in to Employee Portal
- [ ] Session persists on page refresh
- [ ] Auto-logout on token expiry
- [ ] Forgot password flow works

---

#### Day 8-9: User Management Backend (4 developer-days)

| Task                                            | Developer | Days | Status |
| ----------------------------------------------- | --------- | ---- | ------ |
| Implement GET /api/users (list with pagination) | Dev 1     | 0.5  | ☐      |
| Implement GET /api/users/:id (user details)     | Dev 1     | 0.25 | ☐      |
| Implement POST /api/users (create user)         | Dev 1     | 0.5  | ☐      |
| Implement PUT /api/users/:id (update user)      | Dev 1     | 0.5  | ☐      |
| Implement DELETE /api/users/:id (soft delete)   | Dev 2     | 0.25 | ☐      |
| Add validation with Joi for all user endpoints  | Dev 2     | 0.5  | ☐      |
| Implement role-based access control middleware  | Dev 2     | 0.5  | ☐      |
| Create bulk user import endpoint (CSV)          | Dev 1     | 0.75 | ☐      |
| Implement user search and filtering             | Dev 2     | 0.5  | ☐      |
| Test all user endpoints via Postman             | Both      | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] All CRUD operations for users working
- [ ] Pagination, search, and filters working
- [ ] Role-based access enforced
- [ ] CSV import works for bulk users

---

#### Day 10: User Management Frontend (Admin) (2 developer-days)

| Task                                      | Developer | Days | Status |
| ----------------------------------------- | --------- | ---- | ------ |
| Create Users list page with data table    | Dev 1     | 0.5  | ☐      |
| Implement pagination in user table        | Dev 1     | 0.25 | ☐      |
| Create Add User modal/page form           | Dev 2     | 0.5  | ☐      |
| Create Edit User modal/page form          | Dev 2     | 0.5  | ☐      |
| Implement user search and filters UI      | Dev 1     | 0.25 | ☐      |
| Create User profile view page             | Dev 2     | 0.5  | ☐      |
| Add delete/deactivate confirmation dialog | Dev 1     | 0.25 | ☐      |
| Connect all components to Redux/API       | Both      | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] Admin can view list of all users
- [ ] Admin can create new users
- [ ] Admin can edit user details
- [ ] Admin can deactivate users

---

### End of Phase 1 Milestone

**Must Have Completed:**

- [x] Project infrastructure setup
- [x] Database schemas created
- [x] Authentication flow (login/logout/refresh)
- [x] User management CRUD (backend + frontend)
- [x] Role-based access control

**Manual Testing Checklist:**

- [ ] Login with valid credentials → Success, redirect to dashboard
- [ ] Login with invalid credentials → Error message displayed
- [ ] Access protected route without token → Redirect to login
- [ ] Create user with all required fields → User appears in list
- [ ] Edit user details → Changes reflected immediately
- [ ] Deactivate user → User cannot login

---

## PHASE 2: CORE MODULES (Week 3-4)

### Week 3: Schedule & Attendance Backend + Admin Frontend

#### Day 11-12: Schedule Management Backend (4 developer-days)

| Task                                                | Developer | Days | Status |
| --------------------------------------------------- | --------- | ---- | ------ |
| Implement GET /api/schedules (list schedules)       | Dev 1     | 0.5  | ☐      |
| Implement GET /api/schedules/:id (schedule details) | Dev 1     | 0.25 | ☐      |
| Implement POST /api/schedules (create schedule)     | Dev 1     | 0.5  | ☐      |
| Implement PUT /api/schedules/:id (update schedule)  | Dev 1     | 0.5  | ☐      |
| Implement POST /api/schedules/:id/publish           | Dev 2     | 0.5  | ☐      |
| Implement shift conflict detection logic            | Dev 2     | 0.75 | ☐      |
| Implement shift confirmation endpoints              | Dev 2     | 0.5  | ☐      |
| Add validation for schedule creation                | Dev 1     | 0.25 | ☐      |
| Test schedule endpoints via Postman                 | Both      | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] Schedules can be created and managed
- [ ] Conflict detection prevents double-booking
- [ ] Schedules can be published
- [ ] Shift confirmations tracked

---

#### Day 13-14: Schedule Management Frontend (Admin) (4 developer-days)

| Task                                    | Developer | Days | Status |
| --------------------------------------- | --------- | ---- | ------ |
| Create Schedule list/calendar view page | Dev 1     | 0.75 | ☐      |
| Create Schedule creation form           | Dev 1     | 0.5  | ☐      |
| Implement shift assignment grid         | Dev 2     | 0.75 | ☐      |
| Create shift detail modal               | Dev 2     | 0.5  | ☐      |
| Implement publish schedule button       | Dev 1     | 0.25 | ☐      |
| Display conflict warnings               | Dev 2     | 0.5  | ☐      |
| Show confirmation status for each shift | Dev 1     | 0.5  | ☐      |
| Connect to Redux and API                | Both      | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] Admin can view all schedules
- [ ] Admin can create new schedules with shifts
- [ ] Conflicts shown before saving
- [ ] Schedules can be published

---

#### Day 15: Attendance Backend (2 developer-days)

| Task                                         | Developer | Days | Status |
| -------------------------------------------- | --------- | ---- | ------ |
| Implement POST /api/attendance/clock-in      | Dev 1     | 0.5  | ☐      |
| Implement POST /api/attendance/clock-out     | Dev 1     | 0.5  | ☐      |
| Implement POST /api/attendance/break-start   | Dev 2     | 0.25 | ☐      |
| Implement POST /api/attendance/break-end     | Dev 2     | 0.25 | ☐      |
| Implement GET /api/attendance (list records) | Dev 1     | 0.25 | ☐      |
| Implement GET /api/attendance/today          | Dev 2     | 0.25 | ☐      |
| Calculate work hours, breaks, overtime       | Dev 1     | 0.5  | ☐      |
| Implement late arrival detection             | Dev 2     | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] Clock in/out working with IP check
- [ ] Break management functional
- [ ] Work hours calculated automatically
- [ ] Late arrivals flagged

---

### Week 4: Attendance Frontend + Employee Portal Core

#### Day 16-17: Attendance Frontend (Admin) (4 developer-days)

| Task                                | Developer | Days | Status |
| ----------------------------------- | --------- | ---- | ------ |
| Create live attendance dashboard    | Dev 1     | 0.75 | ☐      |
| Show who's clocked in/out/on break  | Dev 1     | 0.5  | ☐      |
| Create attendance records table     | Dev 2     | 0.5  | ☐      |
| Implement date range filtering      | Dev 2     | 0.25 | ☐      |
| Create manual attendance entry form | Dev 1     | 0.5  | ☐      |
| Create attendance correction dialog | Dev 2     | 0.5  | ☐      |
| Display late arrival alerts         | Dev 1     | 0.5  | ☐      |
| Add export to Excel functionality   | Dev 2     | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] Real-time attendance status visible
- [ ] Historical records viewable with filters
- [ ] Manual entries can be added
- [ ] Records can be exported

---

#### Day 18-19: Employee Portal - Dashboard & Attendance (4 developer-days)

| Task                                             | Developer | Days | Status |
| ------------------------------------------------ | --------- | ---- | ------ |
| Create Employee Dashboard layout                 | Dev 1     | 0.5  | ☐      |
| Create sidebar navigation                        | Dev 1     | 0.25 | ☐      |
| Create today's schedule widget                   | Dev 2     | 0.5  | ☐      |
| Create leave balance widget                      | Dev 2     | 0.5  | ☐      |
| Create Clock-in/Clock-out buttons                | Dev 1     | 0.5  | ☐      |
| Create break start/end buttons                   | Dev 1     | 0.25 | ☐      |
| Show current status (clocked in, on break, etc.) | Dev 2     | 0.5  | ☐      |
| Create attendance history page                   | Dev 2     | 0.5  | ☐      |
| Create attendance calendar view                  | Dev 1     | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] Employee can see dashboard on login
- [ ] Clock in/out works for employee
- [ ] Breaks can be managed
- [ ] Attendance history visible

---

#### Day 20: Employee Portal - Schedule View (2 developer-days)

| Task                                        | Developer | Days | Status |
| ------------------------------------------- | --------- | ---- | ------ |
| Create My Schedule page                     | Dev 1     | 0.5  | ☐      |
| Display upcoming shifts in list view        | Dev 1     | 0.25 | ☐      |
| Display shifts in calendar view             | Dev 2     | 0.5  | ☐      |
| Create shift confirmation dialog            | Dev 2     | 0.5  | ☐      |
| Show shift details (client, location, time) | Dev 1     | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] Employee can view upcoming shifts
- [ ] Employee can confirm/decline shifts
- [ ] Calendar view shows all shifts

---

### End of Phase 2 Milestone

**Must Have Completed:**

- [x] Schedule management (Admin)
- [x] Attendance tracking (Admin + Employee)
- [x] Employee portal basic dashboard
- [x] Employee can clock in/out
- [x] Employee can view and confirm shifts

**Manual Testing Checklist:**

- [ ] Create schedule with 5+ shifts → All saved correctly
- [ ] Publish schedule → All employees can view
- [ ] Employee confirms shift → Status updates
- [ ] Employee clocks in → Attendance recorded
- [ ] Employee clocks out → Hours calculated
- [ ] Late arrival → Alert shown to admin

---

## PHASE 3: EXTENDED MODULES (Week 5-6)

### Week 5: Leave Management

#### Day 21-22: Leave Management Backend (4 developer-days)

| Task                                              | Developer | Days | Status |
| ------------------------------------------------- | --------- | ---- | ------ |
| Implement POST /api/leave-requests (create)       | Dev 1     | 0.5  | ☐      |
| Implement GET /api/leave-requests (list)          | Dev 1     | 0.25 | ☐      |
| Implement PUT /api/leave-requests/:id/approve     | Dev 1     | 0.5  | ☐      |
| Implement PUT /api/leave-requests/:id/reject      | Dev 1     | 0.25 | ☐      |
| Implement DELETE /api/leave-requests/:id (cancel) | Dev 2     | 0.25 | ☐      |
| Implement leave balance validation                | Dev 2     | 0.5  | ☐      |
| Implement leave balance deduction on approval     | Dev 2     | 0.5  | ☐      |
| Implement overlap detection                       | Dev 1     | 0.5  | ☐      |
| Create holidays CRUD endpoints                    | Dev 2     | 0.5  | ☐      |
| Test leave endpoints via Postman                  | Both      | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] Leave requests can be created
- [ ] Balance checked before approval
- [ ] Approval/rejection updates balance
- [ ] Holidays calendar managed

---

#### Day 23-24: Leave Management Frontend (4 developer-days)

| Task                                         | Developer | Days | Status |
| -------------------------------------------- | --------- | ---- | ------ |
| Create Leave Requests list page (Admin)      | Dev 1     | 0.5  | ☐      |
| Create approval/rejection dialog             | Dev 1     | 0.5  | ☐      |
| Create Leave calendar view (Admin)           | Dev 2     | 0.5  | ☐      |
| Create Holiday management page (Admin)       | Dev 2     | 0.5  | ☐      |
| Create Leave Request form (Employee)         | Dev 1     | 0.5  | ☐      |
| Show leave balance on form (Employee)        | Dev 1     | 0.25 | ☐      |
| Create My Leave Requests page (Employee)     | Dev 2     | 0.5  | ☐      |
| Show request status with timeline (Employee) | Dev 2     | 0.5  | ☐      |
| Create Holiday calendar view (Employee)      | Dev 1     | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] Admin can view and approve/reject leaves
- [ ] Employee can submit leave requests
- [ ] Leave balance displayed
- [ ] Holiday calendar visible to all

---

#### Day 25: Reimbursement Backend (2 developer-days)

| Task                                            | Developer | Days | Status |
| ----------------------------------------------- | --------- | ---- | ------ |
| Set up file upload middleware (Multer)          | Dev 1     | 0.25 | ☐      |
| Configure S3/Cloudinary for file storage        | Dev 1     | 0.25 | ☐      |
| Implement POST /api/reimbursements (create)     | Dev 1     | 0.5  | ☐      |
| Implement GET /api/reimbursements (list)        | Dev 2     | 0.25 | ☐      |
| Implement PUT /api/reimbursements/:id/approve   | Dev 2     | 0.25 | ☐      |
| Implement PUT /api/reimbursements/:id/reject    | Dev 2     | 0.25 | ☐      |
| Implement PUT /api/reimbursements/:id/mark-paid | Dev 1     | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] Receipts can be uploaded
- [ ] Claims can be created with receipts
- [ ] Approval workflow works
- [ ] Payment marking works

---

### Week 6: Reimbursement Frontend + Client Management

#### Day 26-27: Reimbursement Frontend (4 developer-days)

| Task                                      | Developer | Days | Status |
| ----------------------------------------- | --------- | ---- | ------ |
| Create Reimbursements queue page (Admin)  | Dev 1     | 0.5  | ☐      |
| Create receipt image viewer modal         | Dev 1     | 0.5  | ☐      |
| Create approval/rejection dialog          | Dev 2     | 0.5  | ☐      |
| Create payment processing panel (Admin)   | Dev 2     | 0.5  | ☐      |
| Create Reimbursement form (Employee)      | Dev 1     | 0.5  | ☐      |
| Create receipt upload component           | Dev 1     | 0.5  | ☐      |
| Create My Claims page (Employee)          | Dev 2     | 0.5  | ☐      |
| Show claim status with details (Employee) | Dev 2     | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] Admin can view and process claims
- [ ] Receipts viewable in modal
- [ ] Employee can submit claims
- [ ] Status tracking works

---

#### Day 28-29: Client Management (4 developer-days)

| Task                                    | Developer | Days | Status |
| --------------------------------------- | --------- | ---- | ------ |
| Implement GET /api/clients (list)       | Dev 1     | 0.25 | ☐      |
| Implement POST /api/clients (create)    | Dev 1     | 0.5  | ☐      |
| Implement PUT /api/clients/:id (update) | Dev 1     | 0.25 | ☐      |
| Implement employee assignment to client | Dev 2     | 0.5  | ☐      |
| Create Client list page (Admin)         | Dev 2     | 0.5  | ☐      |
| Create Client form (add/edit)           | Dev 1     | 0.5  | ☐      |
| Create employee assignment panel        | Dev 2     | 0.5  | ☐      |
| Display client billing info             | Dev 1     | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] Clients can be added and managed
- [ ] Employees can be assigned to clients
- [ ] Billing rates configured
- [ ] Client list viewable

---

#### Day 30: Announcements Module (2 developer-days)

| Task                                       | Developer | Days | Status |
| ------------------------------------------ | --------- | ---- | ------ |
| Implement CRUD endpoints for announcements | Dev 1     | 0.5  | ☐      |
| Implement target audience filtering        | Dev 1     | 0.25 | ☐      |
| Create Announcements page (Admin)          | Dev 2     | 0.5  | ☐      |
| Create Announcement composer form          | Dev 2     | 0.5  | ☐      |
| Create Announcement feed (Employee)        | Dev 1     | 0.5  | ☐      |
| Implement mark as read/acknowledge         | Dev 2     | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] Admin can create announcements
- [ ] Target specific roles/departments
- [ ] Employees see relevant announcements
- [ ] Acknowledgment tracking works

---

### End of Phase 3 Milestone

**Must Have Completed:**

- [x] Leave management (Admin + Employee)
- [x] Reimbursement claims (Admin + Employee)
- [x] Client management (Admin)
- [x] Announcements (Admin + Employee)

**Manual Testing Checklist:**

- [ ] Submit leave request → Pending status
- [ ] Approve leave → Balance deducted
- [ ] Submit reimbursement with receipt → Claim visible
- [ ] Approve reimbursement → Status changes
- [ ] Add client → Appears in list
- [ ] Assign employee to client → Shows in client
- [ ] Create announcement → Employees can see it

---

## PHASE 4: INTEGRATION, REPORTS & POLISH (Week 7-8)

### Week 7: Reports & Dashboard Analytics

#### Day 31-32: Dashboard Backend & Frontend (4 developer-days)

| Task                                        | Developer | Days | Status |
| ------------------------------------------- | --------- | ---- | ------ |
| Create GET /api/dashboard/stats endpoint    | Dev 1     | 0.5  | ☐      |
| Create GET /api/dashboard/pending-approvals | Dev 1     | 0.25 | ☐      |
| Create GET /api/dashboard/alerts            | Dev 2     | 0.25 | ☐      |
| Create Admin Dashboard home page            | Dev 1     | 0.75 | ☐      |
| Add stats cards (clocked in, late, absent)  | Dev 2     | 0.5  | ☐      |
| Add pending approvals widget                | Dev 2     | 0.5  | ☐      |
| Add attendance trend chart                  | Dev 1     | 0.5  | ☐      |
| Add quick action buttons                    | Dev 2     | 0.25 | ☐      |
| Finalize Employee dashboard widgets         | Dev 1     | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] Admin dashboard shows live stats
- [ ] Pending approvals count visible
- [ ] Charts display attendance trends
- [ ] Employee dashboard fully functional

---

#### Day 33-34: Reports Module (4 developer-days)

| Task                                   | Developer | Days | Status |
| -------------------------------------- | --------- | ---- | ------ |
| Implement POST /api/reports/generate   | Dev 1     | 0.5  | ☐      |
| Implement attendance report generation | Dev 1     | 0.5  | ☐      |
| Implement leave report generation      | Dev 2     | 0.5  | ☐      |
| Implement Excel export (ExcelJS)       | Dev 1     | 0.75 | ☐      |
| Create Reports page (Admin)            | Dev 2     | 0.5  | ☐      |
| Create report filter form              | Dev 2     | 0.5  | ☐      |
| Add download button for exports        | Dev 1     | 0.25 | ☐      |
| Create employee performance summary    | Dev 2     | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] Attendance reports generate correctly
- [ ] Leave reports generate correctly
- [ ] Excel export works
- [ ] Reports downloadable

---

#### Day 35: Timesheets Module (2 developer-days)

| Task                                | Developer | Days | Status |
| ----------------------------------- | --------- | ---- | ------ |
| Create GET /api/timesheets endpoint | Dev 1     | 0.25 | ☐      |
| Aggregate attendance into timesheet | Dev 1     | 0.5  | ☐      |
| Implement timesheet approval        | Dev 2     | 0.5  | ☐      |
| Create Timesheet page (Admin)       | Dev 2     | 0.5  | ☐      |
| Show hours by employee by week      | Dev 1     | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] Timesheets generated from attendance
- [ ] Approval workflow works
- [ ] Hours summary visible

---

### Week 8: Notifications, Settings, Polish & Testing

#### Day 36-37: Notifications & Settings (4 developer-days)

| Task                                      | Developer | Days | Status |
| ----------------------------------------- | --------- | ---- | ------ |
| Implement GET /api/notifications          | Dev 1     | 0.25 | ☐      |
| Implement PUT /api/notifications/:id/read | Dev 1     | 0.25 | ☐      |
| Create notification dropdown (Admin)      | Dev 2     | 0.5  | ☐      |
| Create notification dropdown (Employee)   | Dev 2     | 0.5  | ☐      |
| Create Settings page (Admin)              | Dev 1     | 0.5  | ☐      |
| Implement attendance policy config        | Dev 1     | 0.5  | ☐      |
| Implement leave policy config             | Dev 2     | 0.5  | ☐      |
| Create Audit Log page                     | Dev 2     | 0.5  | ☐      |
| Implement audit logging middleware        | Dev 1     | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] In-app notifications working
- [ ] Settings page functional
- [ ] Policies configurable
- [ ] Audit logs visible

---

#### Day 38-39: Employee Profile & Polish (4 developer-days)

| Task                                 | Developer | Days | Status |
| ------------------------------------ | --------- | ---- | ------ |
| Create Profile page (Employee)       | Dev 1     | 0.5  | ☐      |
| Create Edit Profile form (Employee)  | Dev 1     | 0.5  | ☐      |
| Implement change password (Employee) | Dev 2     | 0.5  | ☐      |
| Add loading states to all pages      | Dev 1     | 0.5  | ☐      |
| Add error handling/toast messages    | Dev 2     | 0.5  | ☐      |
| Fix responsive issues                | Dev 1     | 0.5  | ☐      |
| Polish navigation and sidebar        | Dev 2     | 0.5  | ☐      |
| Add empty state components           | Dev 2     | 0.25 | ☐      |
| Final UI cleanup                     | Dev 1     | 0.25 | ☐      |

**Deliverable Checklist:**

- [ ] Employee profile editable
- [ ] Password change works
- [ ] Loading states everywhere
- [ ] Error messages user-friendly

---

#### Day 40-42: Integration Testing & Bug Fixes (6 developer-days)

| Task                                     | Developer | Days | Status |
| ---------------------------------------- | --------- | ---- | ------ |
| End-to-end testing: User management flow | Both      | 0.5  | ☐      |
| End-to-end testing: Attendance flow      | Both      | 0.5  | ☐      |
| End-to-end testing: Leave flow           | Both      | 0.5  | ☐      |
| End-to-end testing: Reimbursement flow   | Both      | 0.5  | ☐      |
| End-to-end testing: Schedule flow        | Both      | 0.5  | ☐      |
| Fix identified bugs (buffer time)        | Both      | 2.0  | ☐      |
| Cross-browser testing                    | Dev 1     | 0.5  | ☐      |
| Performance optimization                 | Dev 2     | 0.5  | ☐      |
| Security review                          | Dev 1     | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] All major flows working end-to-end
- [ ] No critical bugs remaining
- [ ] Works on Chrome, Firefox, Edge
- [ ] No security vulnerabilities

---

#### Day 43-44: Documentation & Deployment Prep (4 developer-days)

| Task                                  | Developer | Days | Status |
| ------------------------------------- | --------- | ---- | ------ |
| Write API documentation (Postman)     | Dev 1     | 0.5  | ☐      |
| Update README with setup instructions | Dev 1     | 0.25 | ☐      |
| Create seed data script               | Dev 2     | 0.5  | ☐      |
| Set up staging environment            | Dev 1     | 0.5  | ☐      |
| Deploy to staging server              | Dev 2     | 0.5  | ☐      |
| Test on staging environment           | Both      | 0.5  | ☐      |
| Create deployment checklist           | Dev 1     | 0.25 | ☐      |
| Prepare demo data                     | Dev 2     | 0.5  | ☐      |
| Final review and sign-off             | Both      | 0.5  | ☐      |

**Deliverable Checklist:**

- [ ] API documentation complete
- [ ] README updated
- [ ] Staging environment running
- [ ] Demo ready

---

### End of Phase 4 Milestone

**Must Have Completed:**

- [x] Admin Dashboard with analytics
- [x] Reports and export functionality
- [x] Timesheets module
- [x] Notifications system
- [x] Settings and configuration
- [x] All bug fixes and polish
- [x] Staging deployment

---

## Final MVP Deliverables Checklist

### Admin Dashboard

- [ ] Login/Logout
- [ ] Dashboard with stats and charts
- [ ] User Management (CRUD)
- [ ] Schedule Management
- [ ] Attendance Monitoring
- [ ] Leave Approvals
- [ ] Reimbursement Processing
- [ ] Client Management
- [ ] Announcements
- [ ] Reports & Export
- [ ] Settings

### Employee Portal

- [ ] Login/Logout
- [ ] Dashboard
- [ ] Clock In/Out
- [ ] Break Management
- [ ] View Schedule
- [ ] Confirm/Decline Shifts
- [ ] Submit Leave Requests
- [ ] View Leave Status
- [ ] Submit Reimbursements
- [ ] View Announcements
- [ ] Edit Profile

### Backend

- [ ] All API endpoints working
- [ ] Authentication & Authorization
- [ ] File uploads (receipts)
- [ ] Report generation
- [ ] Data validation
- [ ] Error handling
- [ ] Logging

---

## Risk Mitigation Buffer

**Built-in buffer time:** 4 developer-days (Day 40-42 bug fixes)

**Contingency plan if behind schedule:**

1. Reduce scope of reports module
2. Defer timesheets to Phase 2
3. Simplify announcement targeting
4. Basic settings instead of full configuration

---

## Weekly Status Meeting Checklist

### Questions to Ask Each Week

1. What tasks were completed this week?
2. What tasks are in progress?
3. Are there any blockers?
4. Any scope changes needed?
5. Are we on track for the milestone?

### Status Update Template

```
Week X Status Report
---
Completed: X/Y tasks (Z%)
In Progress: N tasks
Blockers: None / List blockers
Next Week Focus: [Area]
Risk Level: Low/Medium/High
```
