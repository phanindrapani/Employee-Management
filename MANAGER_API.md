# Manager API Documentation

## Base URL

```
http://localhost:5000/api
```

---

# Authentication & User Profile

## Register User

**POST** `/auth/register`

### Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "name": "Alex Smith",
  "email": "alex@example.com",
  "password": "securepassword123",
  "role": "manager",
  "phone": "9876543210",
  "company": "ABC Technologies"
}
```

### Response (201 Created)

```json
{
  "_id": "65db7a91234abc",
  "name": "Alex Smith",
  "email": "alex@example.com",
  "role": "manager",
  "company": "ABC Technologies",
  "clientCode": "",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Response

```json
{
  "message": "User already exists"
}
```

---

# Login User

**POST** `/auth/login`

### Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "email": "alex@example.com",
  "password": "securepassword123"
}
```

### Response (200 OK)

```json
{
  "_id": "65db7a91234abc",
  "name": "Alex Smith",
  "email": "alex@example.com",
  "role": "manager",
  "createdAt": "2026-03-12T10:00:00.000Z",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Response

```json
{
  "message": "Invalid email or password"
}
```

---

# Get User Profile

**GET** `/auth/profile`

### Headers

```
Authorization: Bearer <token>
```

### Response (200 OK)

```json
{
  "_id": "65db7a91234abc",
  "name": "Alex Smith",
  "email": "alex@example.com",
  "phone": "9876543210",
  "profilePicture": "",
  "bio": "",
  "qualification": "",
  "skills": [],
  "department": {
    "_id": "65dbdep123",
    "name": "Engineering"
  },
  "team": {
    "_id": "65dbteam123",
    "name": "Backend Team"
  },
  "reportingManager": {
    "_id": "65dbman123",
    "name": "John Manager",
    "profilePicture": "url"
  },
  "leaveBalance": {
    "cl": 10,
    "sl": 5,
    "el": 12
  },
  "completeness": {
    "totalScore": 60,
    "breakdown": {
      "essential": 40,
      "professional": 10,
      "security": 10
    }
  }
}
```

---

# Update Profile

**PUT** `/auth/profile`

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Form Data

| Field          | Type   | Description   |
| -------------- | ------ | ------------- |
| name           | string | User name     |
| phone          | string | Mobile number |
| bio            | string | User bio      |
| qualification  | string | Education     |
| skills         | array  | Skills list   |
| profilePicture | file   | Profile image |

### Example Request

```
name: Alex Smith
phone: 9876543210
bio: Backend developer with Node.js experience
qualification: B.Tech Computer Science
skills: ["Node.js", "MongoDB"]
profilePicture: image file
```

### Response

```json
{
  "_id": "65db7a91234abc",
  "name": "Alex Smith",
  "email": "alex@example.com",
  "role": "manager",
  "phone": "9876543210",
  "leaveBalance": {
    "cl": 10,
    "sl": 5,
    "el": 12
  },
  "profilePicture": "https://cloudinary.com/profile-image.jpg",
  "bio": "Backend developer with Node.js experience",
  "skills": ["Node.js", "MongoDB"],
  "qualification": "B.Tech Computer Science",
  "createdAt": "2026-03-12T10:00:00.000Z",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

# Change Password

**POST** `/auth/change-password`

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

### Response

```json
{
  "message": "Password updated successfully"
}
```

### Error Responses

Incorrect password

```json
{
  "message": "Current password is incorrect"
}
```

Missing fields

```json
{
  "message": "Current and new password are required"
}
```

# Dashboard APIs

# Get Manager Dashboard Statistics

**GET** `/manager/dashboard/stats`

### Description

Returns **complete dashboard statistics for a manager**, including:

- Team overview
- Project health
- Task summary
- Ticket metrics
- Leave insights
- Alerts
- Recent activity

This endpoint powers the **Manager Dashboard UI**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/dashboard/stats
```

---

### Success Response

```json
{
  "summaryKPIs": {
    "teams": 3,
    "projects": 5,
    "employees": 18,
    "tasks": 120,
    "tickets": 14,
    "overdue": 6
  },
  "projectHealth": [
    {
      "name": "CRM System",
      "team": "Backend Team",
      "progress": 65,
      "status": "Good",
      "systemStatus": "ongoing"
    }
  ],
  "ticketPulse": {
    "open": 14,
    "waiting": 2,
    "inProgress": 5,
    "resolvedToday": 3
  },
  "leaveStats": {
    "onLeaveToday": 2,
    "upcomingLeave": 4
  },
  "alerts": [
    {
      "type": "danger",
      "message": "6 Tasks are currently overdue across all teams."
    }
  ],
  "recentActivity": [
    {
      "title": "Implement login API",
      "status": "in-progress",
      "assignedTo": {
        "name": "Rahul Sharma"
      },
      "updatedAt": "2026-03-12T10:22:00Z"
    }
  ]
}
```
---

# Manager Users APIs

# Get Users

**GET** `/manager/users`

### Description

Returns a list of users filtered by role.

By default, it returns:

```
employee
team-lead
manager
```

Managers can also filter specifically for:

```
client
employee
```

This endpoint is useful for:

```
Assigning tasks
Selecting ticket assignees
Project assignments
User search dropdowns
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Description |
|----------|------|-------------|
| role | string | Filter users by role |

Supported values:

```
employee
client
```

If no role is provided:

```
employee
team-lead
manager
```

will be returned.

---

### Example Requests

#### Get All Employees / Team Leads / Managers

```
GET /manager/users
```

---

#### Get Only Employees

```
GET /manager/users?role=employee
```

---

#### Get Clients

```
GET /manager/users?role=client
```

---

### Success Response

```json
[
  {
    "_id": "65db123456",
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "role": "employee",
    "company": "Manvya Technologies"
  },
  {
    "_id": "65db654321",
    "name": "Anita Verma",
    "email": "anita@example.com",
    "role": "team-lead",
    "company": "Manvya Technologies"
  }
]
```

---

### Response Fields

| Field | Description |
|------|-------------|
| _id | User ID |
| name | User name |
| email | Email address |
| role | User role |
| company | Company name |

---

# Example Use Cases

This API is commonly used in:

```
Manager dashboards
Project assignment screens
Task assignment forms
Ticket assignment
User selection dropdowns
```

---

### Error Response

```json
{
  "message": "Failed to fetch users"
}
```

# Manager Leave APIs

# Get Leave Requests

**GET** `/manager/leaves`

### Description

Returns all leave requests where the logged-in manager is the **approver**.

This endpoint is used for:

```
Manager leave approval dashboard
HR review panels
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/leaves
```

---

### Success Response

```json
[
  {
    "_id": "65leave123",
    "leaveType": "CL",
    "fromDate": "2026-03-15",
    "toDate": "2026-03-17",
    "totalDays": 3,
    "status": "pending",
    "user": {
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "department": "Engineering"
    }
  }
]
```

---

# Get Leave Statistics

**GET** `/manager/leaves/stats`

### Description

Returns summary statistics of leave requests handled by the manager.

Grouped by:

```
approved
rejected
pending
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/leaves/stats
```

---

### Success Response

```json
[
  {
    "_id": "approved",
    "count": 12
  },
  {
    "_id": "pending",
    "count": 5
  },
  {
    "_id": "rejected",
    "count": 2
  }
]
```

---

# Approve or Reject Leave

**PUT** `/manager/leaves/:id/status`

### Description

Allows a manager to **approve or reject a leave request**.

Special rules:

```
Only the assigned approver can update
Leave must be in pending state
Rejection requires reason
Leave balance is deducted automatically if approved
```

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Request Body (Approve)

```json
{
  "status": "approved"
}
```

---

### Request Body (Reject)

```json
{
  "status": "rejected",
  "rejectionReason": "Project deadline approaching"
}
```

---

### Success Response

```json
{
  "_id": "65leave123",
  "status": "approved",
  "totalDays": 3
}
```

---

### Error Responses

```json
{
  "message": "Leave request already processed"
}
```

```json
{
  "message": "Not authorized to approve this leave"
}
```

---

# Apply Leave (Manager Self-Service)

**POST** `/manager/leaves`

### Description

Managers can apply leave for themselves.

Features:

```
Leave balance validation
Working days calculation
Optional attachment upload
Manager approval workflow
Email notification
Real-time notification
```

---

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

### Form Data

| Field | Type | Description |
|------|------|-------------|
| leaveType | string | CL / SL / EL / LOP |
| fromDate | string | Leave start date |
| toDate | string | Leave end date |
| session | string | full-day / half-morning / half-afternoon |
| reason | string | Leave reason |
| attachment | file | Optional document |

---

### Example Request

```
POST /manager/leaves
```

---

### Success Response

```json
{
  "_id": "65leave987",
  "leaveType": "CL",
  "totalDays": 2,
  "status": "pending"
}
```

---

# Get My Leaves

**GET** `/manager/leaves/my-leaves`

### Description

Returns leave requests submitted by the logged-in manager.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/leaves/my-leaves
```

---

### Success Response

```json
[
  {
    "_id": "65leave987",
    "leaveType": "CL",
    "fromDate": "2026-03-18",
    "toDate": "2026-03-19",
    "status": "pending"
  }
]
```

---

# Calculate Leave Days

**POST** `/manager/leaves/calculate`

### Description

Calculates total working leave days before applying.

Excludes:

```
Sundays
Company holidays
```

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Request Body

```json
{
  "fromDate": "2026-03-20",
  "toDate": "2026-03-25",
  "session": "full-day"
}
```

---

### Success Response

```json
{
  "totalDays": 4
}
```

# Milestone APIs

# Get Project Milestones

**GET** `/manager/milestones/project/:projectId`

### Description

Returns all milestones associated with a project managed by the logged-in manager.

Managers can only access milestones for **their own projects**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/milestones/project/65proj123
```

---

### Success Response

```json
[
  {
    "_id": "65mile123",
    "name": "Backend Development",
    "milestoneId": "MS-001",
    "status": "in-progress",
    "progress": 40,
    "dueDate": "2026-04-10",
    "assignedTeam": {
      "name": "Backend Team"
    }
  }
]
```

---

# Get Project Tasks

**GET** `/manager/milestones/project/:projectId/tasks`

### Description

Fetches all tasks associated with a specific project.

Includes:

```
Assigned employee
Assigned team
Milestone reference
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/milestones/project/65proj123/tasks
```

---

### Success Response

```json
[
  {
    "_id": "65task001",
    "title": "Implement login API",
    "status": "in-progress",
    "assignedTo": {
      "name": "Rahul Sharma",
      "email": "rahul@example.com"
    },
    "teamId": {
      "name": "Backend Team"
    },
    "milestoneId": {
      "name": "Authentication Module"
    }
  }
]
```

---

# Create Milestone

**POST** `/manager/milestones`

### Description

Creates a milestone for a project.

Rules:

```
Manager must own the project
Assigned team is optional
Project team list will be updated automatically
```

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Request Body

```json
{
  "name": "Authentication Module",
  "milestoneId": "MS-001",
  "projectId": "65proj123",
  "assignedTeam": "65team123",
  "dueDate": "2026-04-10"
}
```

---

### Success Response

```json
{
  "_id": "65mile123",
  "name": "Authentication Module",
  "milestoneId": "MS-001",
  "status": "pending",
  "progress": 0
}
```

---

# Update Milestone

**PUT** `/manager/milestones/:id`

### Description

Updates milestone details such as:

```
Name
Status
Progress
Due date
Assigned team
```

Only the **project manager** can update the milestone.

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Example Request

```
PUT /manager/milestones/65mile123
```

---

### Request Body

```json
{
  "status": "in-progress",
  "progress": 50
}
```

---

### Success Response

```json
{
  "_id": "65mile123",
  "name": "Authentication Module",
  "status": "in-progress",
  "progress": 50
}
```

---

# Delete Milestone

**DELETE** `/manager/milestones/:id`

### Description

Deletes a milestone.

Restriction:

```
Milestone cannot be deleted if tasks are linked to it.
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
DELETE /manager/milestones/65mile123
```

---

### Success Response

```json
{
  "message": "Milestone deleted"
}
```

---

### Error Responses

Milestone has tasks:

```json
{
  "message": "Cannot delete milestone with existing tasks"
}
```

Unauthorized access:

```json
{
  "message": "Not authorized"
}
```

---

# Manager Performance APIs

# Get Manager Performance Dashboard

**GET** `/manager/performance/dashboard`

### Description

Returns a **complete performance dashboard for a manager**, including:

- Team performance metrics
- Organization average score
- Top performers
- Team leaders ranking
- Performance trends (last 6 months)
- Teams needing improvement

This endpoint powers the **Manager Performance Dashboard**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Description |
|----------|------|-------------|
| period | string | Performance period in format `YYYY-MM` |

If not provided, the current month is used.

Example:

```
GET /manager/performance/dashboard?period=2026-03
```

---

### Example Request

```
GET /manager/performance/dashboard
```

---

### Success Response

```json
{
  "summary": {
    "totalTeams": 3,
    "totalEmployees": 18,
    "activeProjects": 6,
    "orgAvgScore": 74,
    "highestTeamAvg": 88,
    "teamsNeedingAttention": 1
  },
  "teams": [
    {
      "teamId": "65team123",
      "teamName": "Backend Team",
      "leadName": "Rahul Sharma",
      "membersCount": 6,
      "trackedCount": 6,
      "avgScore": 78,
      "highestScore": 92,
      "needsAttention": 1,
      "members": [
        {
          "name": "Rahul Sharma",
          "score": 85,
          "isLead": true
        },
        {
          "name": "Anita Verma",
          "score": 76,
          "isLead": false
        }
      ]
    }
  ],
  "performanceTrend": [
    { "name": "2025-10", "score": 68 },
    { "name": "2025-11", "score": 70 },
    { "name": "2025-12", "score": 72 },
    { "name": "2026-01", "score": 74 },
    { "name": "2026-02", "score": 76 },
    { "name": "2026-03", "score": 78 }
  ],
  "topLeads": [
    {
      "name": "Rahul Sharma",
      "score": 88,
      "team": "Backend Team"
    }
  ],
  "topPerformers": [
    {
      "user": {
        "name": "Anita Verma"
      },
      "totalScore": 92
    }
  ]
}
```

---

# Project APIs

# Get Manager Projects

**GET** `/manager/projects`

### Description

Returns projects **managed by the logged-in manager** or assigned to their teams.

Projects are sorted by latest update.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/projects
```

---

### Success Response

```json
[
  {
    "_id": "65proj123",
    "name": "CRM System",
    "status": "ongoing",
    "progress": 45,
    "assignedTeams": [
      {
        "name": "Backend Team"
      }
    ],
    "clientId": {
      "name": "ABC Corp",
      "company": "ABC Corporation"
    }
  }
]
```

---

# Get All Company Projects

**GET** `/manager/projects/all`

### Description

Returns **all projects across the company**, regardless of manager ownership.

Useful for:

```
Company overview
Cross-team project visibility
Reporting dashboards
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/projects/all
```

---

### Success Response

```json
[
  {
    "_id": "65proj999",
    "name": "Mobile App",
    "status": "ongoing",
    "clientId": {
      "name": "XYZ Ltd",
      "company": "XYZ Ltd"
    }
  }
]
```

---

# Get Project Statistics

**GET** `/manager/projects/stats`

### Description

Returns project counts grouped by **project status**.

Statuses include:

```
upcoming
ongoing
completed
on-hold
cancelled
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/projects/stats
```

---

### Success Response

```json
[
  {
    "_id": "ongoing",
    "count": 5
  },
  {
    "_id": "completed",
    "count": 2
  }
]
```

---

# Get Team Leads

**GET** `/manager/projects/team-leads`

### Description

Returns all users with the role **team-lead**.

Used when assigning teams or leaders to projects.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/projects/team-leads
```

---

### Success Response

```json
[
  {
    "_id": "65user123",
    "name": "Rahul Sharma",
    "email": "rahul@example.com"
  }
]
```

---

# Create Project

**POST** `/manager/projects`

### Description

Creates a new project.

Features:

```
Manager automatically set as creator
Project progress starts at 0
Real-time notifications sent to team members
```

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Request Body

```json
{
  "name": "CRM System",
  "description": "Customer Relationship Management system",
  "priority": "high",
  "status": "upcoming",
  "startDate": "2026-04-01",
  "endDate": "2026-06-30",
  "assignedTeam": "65team123",
  "clientId": "65client123"
}
```

---

### Success Response

```json
{
  "_id": "65proj123",
  "name": "CRM System",
  "status": "upcoming",
  "progress": 0
}
```

---

# Update Project

**PUT** `/manager/projects/:id`

### Description

Updates project details.

Fields that can be updated:

```
name
description
priority
status
assignedTeams
dates
client
```

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Example Request

```
PUT /manager/projects/65proj123
```

---

### Request Body

```json
{
  "status": "ongoing",
  "priority": "high"
}
```

---

### Success Response

```json
{
  "_id": "65proj123",
  "status": "ongoing"
}
```

---

# Delete Project

**DELETE** `/manager/projects/:id`

### Description

Deletes a project and all related tasks.

Effects:

```
Project removed
All project tasks deleted
Real-time updates sent to teams
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
DELETE /manager/projects/65proj123
```

---

### Success Response

```json
{
  "message": "Deleted"
}
```

---

# Task APIs

# Get Manager Task Dashboard

**GET** `/manager/tasks/dashboard`

### Description

Returns a **complete task dashboard for the manager** including:

- Task summary metrics
- Team task breakdown
- Employee workload
- Project progress
- Recent task activity
- Task list with filters
- Overdue tasks overview

This endpoint powers the **Manager Task Dashboard UI**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Description |
|----------|------|-------------|
| status | string | Filter tasks by status |
| priority | string | Filter tasks by priority |
| search | string | Search tasks by title |
| team | string | Filter by team ID |
| project | string | Filter by project ID |

Example

```
GET /manager/tasks/dashboard?status=in-progress&priority=high
```

---

### Example Request

```
GET /manager/tasks/dashboard
```

---

### Success Response

```json
{
  "summary": {
    "total": 120,
    "pending": 25,
    "inProgress": 60,
    "completed": 30,
    "overdue": 5,
    "blocked": 0
  },
  "teamBreakdown": [
    {
      "teamId": "65team123",
      "teamName": "Backend Team",
      "total": 50,
      "completed": 20,
      "inProgress": 25,
      "overdue": 5
    }
  ],
  "employeeWorkload": [
    {
      "name": "Rahul Sharma",
      "totalTasks": 12,
      "inProgress": 5,
      "overdue": 1
    }
  ],
  "projectProgress": [
    {
      "projectId": "65proj123",
      "projectName": "CRM System",
      "totalTasks": 40,
      "completed": 20,
      "progress": 50
    }
  ],
  "recentActivity": [
    {
      "title": "Fix authentication bug",
      "status": "in-progress",
      "assignedTo": { "name": "Anita Verma" }
    }
  ]
}
```

---

# Get Task Statistics

**GET** `/manager/tasks/stats`

### Description

Returns **task counts grouped by status** across all projects managed by the manager.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/tasks/stats
```

---

### Success Response

```json
[
  {
    "_id": "todo",
    "count": 25
  },
  {
    "_id": "in-progress",
    "count": 60
  },
  {
    "_id": "review",
    "count": 10
  },
  {
    "_id": "done",
    "count": 30
  }
]
```

---

# Get Overdue Tasks

**GET** `/manager/tasks/overdue`

### Description

Returns all tasks that:

- Belong to projects managed by the manager
- Are **not completed**
- Have a **deadline earlier than the current date**

Used for:

```
Manager alerts
Risk monitoring
Project delays tracking
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/tasks/overdue
```

---

### Success Response

```json
[
  {
    "_id": "65task123",
    "title": "Implement login feature",
    "deadline": "2026-03-01T00:00:00.000Z",
    "assignedTo": {
      "name": "Rahul Sharma",
      "email": "rahul@example.com"
    },
    "project": {
      "name": "CRM System"
    }
  }
]
```

---

# Error Response

```json
{
  "message": "Failed to fetch dashboard data"
}
```

# Teams API

# Get Manager Teams

**GET** `/manager/teams`

### Description

Returns all teams that are **managed by the logged-in manager**.

Each team includes:

- Department information
- Team lead details
- Team metadata

This endpoint is commonly used in:

```
Manager dashboards
Team management panels
Project assignment modules
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/teams
```

---

### Success Response

```json
[
  {
    "_id": "65team123",
    "name": "Backend Team",
    "department": {
      "_id": "65dept123",
      "name": "Engineering",
      "color": "#4CAF50"
    },
    "teamLead": {
      "_id": "65user456",
      "name": "Rahul Sharma",
      "email": "rahul@example.com"
    },
    "manager": "65manager123"
  }
]
```

# Error Response

```json
{
  "message": "Failed to fetch teams"
}
```

# Ticket APIs

# Get Manager Tickets

**GET** `/manager/tickets`

### Description

Returns all tickets **assigned to the logged-in manager**.

Supports filtering by:

- status
- priority
- category

Tickets are sorted by **priority and latest created**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Description |
|----------|------|-------------|
| status | string | Filter by ticket status |
| priority | string | Filter by priority |
| category | string | Filter by category |

Example

```
GET /manager/tickets?status=OPEN&priority=HIGH
```

---

### Success Response

```json
[
  {
    "_id": "65ticket123",
    "title": "Login not working",
    "priority": "HIGH",
    "status": "OPEN",
    "clientId": {
      "name": "John Doe",
      "company": "ABC Corp"
    },
    "assignedTeamLead": {
      "name": "Rahul Sharma"
    },
    "projectId": {
      "name": "CRM System"
    }
  }
]
```

---

# Get Ticket By ID

**GET** `/manager/tickets/:id`

### Description

Returns detailed information for a specific ticket.

Includes:

- Client details
- Assigned team lead
- Assigned employee
- Comments history

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/tickets/65ticket123
```

---

### Success Response

```json
{
  "_id": "65ticket123",
  "title": "Login issue",
  "description": "User unable to login",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "assignedTeamLead": {
    "name": "Rahul Sharma",
    "email": "rahul@example.com"
  },
  "assignedEmployee": {
    "name": "Anita Verma",
    "email": "anita@example.com"
  },
  "comments": [
    {
      "message": "Investigating the issue",
      "role": "manager"
    }
  ]
}
```

---

# Assign Ticket to Team Lead

**PATCH** `/manager/tickets/:id/assign-teamlead`

### Description

Assigns a ticket to a **team lead**.

When assigned:

- Ticket status becomes **ASSIGNED**
- Assignment history is recorded
- Team lead receives **notification**
- Real-time socket event is triggered

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Request Body

```json
{
  "teamLeadId": "65user123",
  "note": "Please investigate this issue"
}
```

---

### Success Response

```json
{
  "message": "Ticket assigned to Rahul Sharma",
  "ticket": {
    "_id": "65ticket123",
    "status": "ASSIGNED"
  }
}
```

---

# Add Comment to Ticket

**POST** `/manager/tickets/:id/comment`

### Description

Adds a comment to the ticket.

Two types of comments:

| Type | Visibility |
|-----|------------|
| Internal | Visible only to support team |
| Public | Visible to client |

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Request Body

```json
{
  "message": "Investigating the issue",
  "isInternal": true
}
```

---

### Success Response

```json
{
  "message": "Comment added"
}
```

---

# Get Ticket Analytics

**GET** `/manager/tickets/analytics`

### Description

Returns ticket analytics for the manager including:

- Total tickets
- Open tickets
- In progress
- Resolved
- Closed
- SLA breaches
- Tickets grouped by priority

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/tickets/analytics
```

---

### Success Response

```json
{
  "summary": {
    "total": 40,
    "open": 10,
    "inProgress": 12,
    "resolved": 10,
    "closed": 6,
    "slaBreached": 2
  },
  "byPriority": {
    "LOW": 5,
    "MEDIUM": 20,
    "HIGH": 10,
    "CRITICAL": 5
  }
}
```

---

# Get Ticket Stats

**GET** `/manager/tickets/stats`

### Description

Returns quick statistics for the manager's tickets.

Used for **dashboard summary cards**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/tickets/stats
```

---

### Success Response

```json
{
  "total": 40,
  "pending": 15,
  "breached": 2,
  "closed": 6
}
```

# Error Response

```json
{
  "message": "Failed to fetch tickets"
}
```

# Work Log APIs

# Get Manager Work Logs

**GET** `/manager/worklogs`

### Description

Returns the latest **work log entries of employees under the manager’s teams**.

Logs are sorted by:

```
date (latest first)
startTime
```

Maximum results returned:

```
100 entries
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/worklogs
```

---

### Success Response

```json
[
  {
    "_id": "65log123",
    "employee": {
      "name": "Rahul Sharma",
      "email": "rahul@example.com"
    },
    "date": "2026-03-12",
    "startTime": "09:00",
    "endTime": "11:00",
    "durationMinutes": 120,
    "taskTitle": "Implement authentication",
    "project": "CRM System",
    "category": "development",
    "status": "completed"
  }
]
```

---

# Get Work Log Statistics

**GET** `/manager/worklogs/stats`

### Description

Returns aggregated statistics for employee work logs grouped by **work category**.

This helps managers understand how team time is distributed across different activities.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /manager/worklogs/stats
```

---

### Success Response

```json
[
  {
    "_id": "development",
    "totalMinutes": 12000,
    "count": 150
  },
  {
    "_id": "meeting",
    "totalMinutes": 3200,
    "count": 50
  },
  {
    "_id": "testing",
    "totalMinutes": 2400,
    "count": 40
  }
]
```

---

# Get Work Log Analysis

**GET** `/manager/worklogs/analysis`

### Description

Returns **advanced work log analytics** for employees under the manager.

This analysis includes:

- Productivity trends
- Team time distribution
- Employee time allocation
- Category-based activity insights

Default analysis range:

```
Last 30 days
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Description |
|----------|------|-------------|
| fromDate | string | Start date (YYYY-MM-DD) |
| toDate | string | End date (YYYY-MM-DD) |

Example

```
GET /manager/worklogs/analysis?fromDate=2026-02-01&toDate=2026-03-01
```

---

### Success Response

```json
{
  "fromDate": "2026-02-01",
  "toDate": "2026-03-01",
  "teamEmployeeDistribution": [
    {
      "name": "Backend Team",
      "Rahul Sharma": 120,
      "Anita Verma": 95,
      "totalHours": 215
    },
    {
      "name": "Frontend Team",
      "Arjun Patel": 80,
      "Meera Nair": 110,
      "totalHours": 190
    }
  ]
}
```

---

# Error Response

```json
{
  "message": "Failed to fetch work logs"
}
```

# Notification APIs

Base Path

```
/api/notifications
```

Authentication

All endpoints require authentication.

Allowed Roles

```
admin
manager
team-lead
employee
client
```

These APIs allow users to:

- View their notifications
- Mark a notification as read
- Mark all notifications as read

Notifications are generated by the system when events occur such as:

```
Ticket updates
Task assignments
Leave approvals
Document uploads
Project updates
Internal messages
```

---

# Get My Notifications

**GET** `/notifications`

### Description

Returns all notifications for the logged-in user.

Notifications are sorted by:

```
Newest first (createdAt descending)
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /notifications
```

---

### Success Response

```json
[
  {
    "_id": "65notif123",
    "user": "65user123",
    "message": "New Ticket Assigned: Login Issue",
    "isRead": false,
    "createdAt": "2026-03-13T10:22:00.000Z"
  },
  {
    "_id": "65notif456",
    "user": "65user123",
    "message": "Your leave request has been approved",
    "isRead": true,
    "createdAt": "2026-03-12T14:10:00.000Z"
  }
]
```

---

# Mark Notification as Read

**PUT** `/notifications/:id/read`

### Description

Marks a specific notification as **read**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
PUT /notifications/65notif123/read
```

---

### Success Response

```json
{
  "message": "Notification marked as read"
}
```

---

### Error Response

```json
{
  "message": "Notification not found"
}
```

---

# Mark All Notifications as Read

**PUT** `/notifications/read-all`

### Description

Marks **all unread notifications** for the logged-in user as read.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
PUT /notifications/read-all
```

---

### Success Response

```json
{
  "message": "All notifications marked as read"
}
```

# Error Response

```json
{
  "message": "Failed to fetch notifications"
}
```