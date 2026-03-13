# Team Lead API Documentation

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
  "role": "team-lead",
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
  "role": "team-lead",
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
  "role": "team-lead",
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
  "role": "team-lead",
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

# Get Team Dashboard Statistics

**GET** `/team-lead/dashboard/stats`

### Description

Returns the **dashboard statistics for the logged-in team lead’s team**.

This endpoint powers the **Team Lead Dashboard** and provides:

- Team statistics
- Weekly productivity score
- Productivity trend chart
- Alerts related to tasks, leaves, and projects

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /team-lead/dashboard/stats
```

---

### Success Response

```json
{
  "totalMembers": 8,
  "activeProjects": 3,
  "pendingTasks": 6,
  "completedTasks": 24,
  "onLeaveToday": 1,
  "pendingApprovals": 6,
  "weeklyProductivity": 72,
  "productivityTrend": [
    {
      "day": "Mon",
      "value": 70
    },
    {
      "day": "Tue",
      "value": 75
    },
    {
      "day": "Wed",
      "value": 68
    }
  ],
  "alerts": [
    {
      "type": "Project",
      "message": "2 projects ending within 7 days",
      "severity": "warning"
    },
    {
      "type": "Resource",
      "message": "1 team members on leave today",
      "severity": "info"
    }
  ]
}
```

---

# Response Fields

### Team Statistics

| Field | Description |
|------|-------------|
| totalMembers | Number of members in the team |
| activeProjects | Number of projects assigned to the team |
| pendingTasks | Tasks requiring attention |
| completedTasks | Tasks completed by the team |
| onLeaveToday | Team members currently on leave |

---

### Productivity Metrics

| Field | Description |
|------|-------------|
| weeklyProductivity | Average productivity score for the past week |
| productivityTrend | Daily productivity values used for charts |

Example trend entry:

```json
{
  "day": "Mon",
  "value": 70
}
```

---

### Alerts

Alerts notify team leads about important situations.

| Type | Description |
|------|-------------|
| Project | Projects ending soon |
| Resource | Team members currently on leave |
| Task | Tasks requiring review |

Example alert:

```json
{
  "type": "Project",
  "message": "2 projects ending within 7 days",
  "severity": "warning"
}
```

---

# Error Responses

### No Team Assigned

```json
{
  "message": "No team assigned to this profile"
}
```

---

### Server Error

```json
{
  "message": "Failed to fetch team stats"
}
```

# Leave APIs

# Get Team Leave Requests

**GET** `/team-lead/leaves`

### Description

Returns leave requests assigned to the **logged-in team lead for approval**.

Leave requests include:

- Employee information
- Leave type
- Duration
- Current status

Requests are sorted by:

```
Most recent first (createdAt descending)
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /team-lead/leaves
```

---

### Success Response

```json
[
  {
    "_id": "65leave123",
    "leaveType": "CL",
    "fromDate": "2026-03-20",
    "toDate": "2026-03-21",
    "totalDays": 2,
    "status": "pending",
    "user": {
      "name": "Rahul Sharma",
      "profilePicture": "https://example.com/profile.jpg",
      "department": "Engineering"
    }
  }
]
```

---

# Update Leave Status

**PUT** `/team-lead/leaves/:id/status`

### Description

Allows the team lead to **approve or reject a leave request**.

When a leave is approved:

- Employee leave balance is updated
- Leave status changes to **approved**
- Employee receives notification
- Email is sent to the employee

When rejected:

- Status becomes **rejected**
- Rejection reason must be provided

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
  "leaveType": "CL",
  "totalDays": 2,
  "status": "approved",
  "balanceApplied": true
}
```

---

# Error Responses

### Leave Request Not Found

```json
{
  "message": "Leave request not found"
}
```

---

### Already Processed

```json
{
  "message": "Leave request already processed"
}
```

---

### Rejection Reason Missing

```json
{
  "message": "Rejection reason is mandatory"
}
```

---

### Insufficient Leave Balance

```json
{
  "message": "Insufficient CL balance"
}
```

---

### Server Error

```json
{
  "message": "Failed to update leave status"
}
```

# Milestone APIs

# Get All Team Milestones

**GET** `/team-lead/milestones`

### Description

Returns **all milestones belonging to projects assigned to the team lead’s team**.

Used in:

```
Team lead dashboards
Project milestone tracking
Progress monitoring
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /team-lead/milestones
```

---

### Success Response

```json
[
  {
    "_id": "65milestone123",
    "name": "Backend API Development",
    "status": "in-progress",
    "progress": 60,
    "projectId": {
      "name": "CRM System"
    }
  }
]
```

---

# Get Project Milestones

**GET** `/team-lead/milestones/project/:projectId`

### Description

Returns all milestones for a **specific project assigned to the team lead's team**.

If the project is **not assigned to the team**, access is denied.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /team-lead/milestones/project/65proj123
```

---

### Success Response

```json
[
  {
    "_id": "65milestone123",
    "name": "Database Setup",
    "status": "completed",
    "progress": 100,
    "assignedTeam": {
      "name": "Backend Team"
    }
  },
  {
    "_id": "65milestone124",
    "name": "API Development",
    "status": "in-progress",
    "progress": 50
  }
]
```

---

# Update Milestone Status

**PATCH** `/team-lead/milestones/:id/status`

### Description

Allows team leads to update the **status of a milestone**.

Valid status values:

```
pending
in-progress
completed
```

When status is set to **completed**:

```
progress automatically becomes 100%
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
  "status": "completed"
}
```

---

### Success Response

```json
{
  "_id": "65milestone123",
  "name": "Backend API Development",
  "status": "completed",
  "progress": 100
}
```

---

# Error Responses

### Access Denied

```json
{
  "message": "Access denied: Project not assigned to your team"
}
```

---

### Milestone Not Found

```json
{
  "message": "Milestone not found"
}
```

---

### Invalid Status

```json
{
  "message": "Invalid status value"
}
```

---

### Server Error

```json
{
  "message": "Internal server error"
}
```

# Notification APIs

# Get My Notifications

**GET** `/team-lead/notifications`

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
GET /team-lead/notifications
```

---

### Success Response

```json
[
  {
    "_id": "65notif123",
    "user": "65user123",
    "message": "Task submitted for review",
    "isRead": false,
    "createdAt": "2026-03-15T10:30:00.000Z"
  },
  {
    "_id": "65notif456",
    "user": "65user123",
    "message": "Milestone completed by Backend Team",
    "isRead": true,
    "createdAt": "2026-03-14T12:10:00.000Z"
  }
]
```

---

# Mark Notification as Read

**PUT** `/team-lead/notifications/:id/read`

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
PUT /team-lead/notifications/65notif123/read
```

---

### Success Response

```json
{
  "message": "Notification marked as read"
}
```

---

# Mark All Notifications as Read

**PUT** `/team-lead/notifications/read-all`

### Description

Marks **all unread notifications for the logged-in user** as read.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
PUT /team-lead/notifications/read-all
```

---

### Success Response

```json
{
  "message": "All notifications marked as read"
}
```

# Error Response

### Notification Not Found

```json
{
  "message": "Notification not found"
}
```

---

### Server Error

```json
{
  "message": "Failed to fetch notifications"
}
```

# Project APIs

# Get Team Projects

**GET** `/team-lead/projects`

### Description

Returns all projects assigned to the **team lead's team**.

Projects are sorted by:

```
End date (earliest first)
```

Used for:

```
Team dashboards
Project tracking
Delivery planning
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /team-lead/projects
```

---

### Success Response

```json
[
  {
    "_id": "65proj123",
    "name": "CRM System",
    "progress": 45,
    "status": "ongoing",
    "assignedTeams": [
      {
        "name": "Backend Team"
      }
    ],
    "endDate": "2026-06-30"
  }
]
```

---

# Update Project Progress

**PUT** `/team-lead/projects/:id/progress`

### Description

Allows a **team lead to override project progress**.

Two progress modes are supported:

| Mode | Description |
|-----|-------------|
| manual | Team lead manually sets progress |
| auto | Progress is calculated automatically from tasks |

When progress is updated:

- Project progress is recalculated
- Real-time updates are sent via sockets
- Admins and team members receive updates

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Request Body (Manual Progress)

```json
{
  "mode": "manual",
  "progress": 60
}
```

---

### Request Body (Automatic Mode)

```json
{
  "mode": "auto"
}
```

---

### Success Response

```json
{
  "_id": "65proj123",
  "name": "CRM System",
  "progress": 60,
  "assignedTeams": [
    {
      "name": "Backend Team"
    }
  ]
}
```

---

# Authorization Rules

A team lead can update progress **only if**:

```
The project is assigned to their team
```

Otherwise the API returns:

```json
{
  "message": "Not authorized to override progress for this project"
}
```

---

# Error Responses

### Project Not Found

```json
{
  "message": "Project not found"
}
```

---

### Invalid Progress Parameters

```json
{
  "message": "Invalid progress override parameters"
}
```

---

### Server Error

```json
{
  "message": "Failed to update project progress"
}
```

# Report APIs

# Get Team Performance Reports

**GET** `/team-lead/reports`

### Description

Returns **performance analytics for the team managed by the logged-in team lead**.

The report includes:

- Productivity trend for the last 7 days
- Individual team member contributions
- Team achievement summary

Used for:

```
Team performance dashboards
Productivity monitoring
Weekly team reporting
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /team-lead/reports
```

---

### Success Response

```json
{
  "productivityTrend": [
    {
      "name": "Mon",
      "efficiency": 70
    },
    {
      "name": "Tue",
      "efficiency": 75
    },
    {
      "name": "Wed",
      "efficiency": 68
    }
  ],
  "contributionData": [
    {
      "name": "Rahul Sharma",
      "value": 12
    },
    {
      "name": "Anita Verma",
      "value": 9
    }
  ],
  "summary": {
    "achievementRate": 78,
    "totalCompleted": 21,
    "teamSize": 6
  }
}
```

---

# Error Response

### Server Error

```json
{
  "message": "Failed to generate team reports"
}
```

# Task APIs

# Get Team Tasks

**GET** `/team-lead/tasks`

### Description

Returns **all tasks assigned to members of the team lead's team**.

The API fetches:

- Tasks assigned to team members
- Project details
- Milestone information
- Task creator
- Task comments

---

### Example Request

```
GET /team-lead/tasks
```

---

### Success Response

```json
[
  {
    "_id": "664a3f1e92f33b4c76a1c111",
    "title": "Implement login API",
    "description": "Create JWT authentication",
    "status": "todo",
    "priority": "high",
    "deadline": "2026-04-10T00:00:00.000Z",
    "project": {
      "_id": "6634aa3c8c7b1a21",
      "name": "Employee Portal"
    },
    "milestoneId": {
      "_id": "6634aa3c8c7b1a21",
      "name": "Authentication Module"
    },
    "assignedTo": {
      "_id": "6634aa3c8c7b1a21",
      "name": "Rahul Sharma",
      "email": "rahul@company.com"
    },
    "assignedBy": {
      "_id": "6634aa3c8c7b1a21",
      "name": "Team Lead"
    }
  }
]
```

---

# Create Task

**POST** `/team-lead/tasks`

### Description

Creates a **new task for a team member**.

The team lead can only assign tasks to **members within their team**.

---

### Request Body

```json
{
  "project": "6634aa3c8c7b1a21",
  "milestoneId": "6634aa3c8c7b1a21",
  "teamId": "6634aa3c8c7b1a21",
  "title": "Build login UI",
  "description": "Create React login page",
  "assignedTo": "6634aa3c8c7b1a21",
  "deadline": "2026-04-20",
  "priority": "high",
  "weight": 5
}
```

---

### Success Response

```json
{
  "_id": "664a3f1e92f33b4c76a1c111",
  "title": "Build login UI",
  "description": "Create React login page",
  "status": "todo",
  "priority": "high",
  "project": {
    "_id": "6634aa3c8c7b1a21",
    "name": "Employee Portal"
  },
  "assignedTo": {
    "_id": "6634aa3c8c7b1a21",
    "name": "Rahul Sharma",
    "email": "rahul@company.com"
  }
}
```

---

# Update Task

**PUT** `/team-lead/tasks/:id`

### Description

Updates an existing task.

Allowed updates:

- Title
- Description
- Assigned user
- Deadline
- Priority
- Status
- Project
- Milestone
- Weight

Status workflow:

```
todo → in-progress → review → done
```

A task **must be in review before being marked done**.

---

### Request Body Example

```json
{
  "title": "Update login UI",
  "status": "in-progress",
  "priority": "medium",
  "deadline": "2026-04-25"
}
```

---

### Success Response

```json
{
  "_id": "664a3f1e92f33b4c76a1c111",
  "title": "Update login UI",
  "status": "in-progress",
  "priority": "medium",
  "deadline": "2026-04-25T00:00:00.000Z"
}
```

---

# Delete Task

**DELETE** `/team-lead/tasks/:id`

### Description

Deletes a task.

Restrictions:

- Team leads can only delete tasks assigned to **their team members**.

---

### Example Request

```
DELETE /team-lead/tasks/664a3f1e92f33b4c76a1c111
```

---

### Success Response

```json
{
  "message": "Task deleted successfully"
}
```

---

# Error Responses

### Task Not Found

```json
{
  "message": "Task not found"
}
```

### Unauthorized

```json
{
  "message": "You can only assign tasks to your own team members"
}
```

### Invalid Status

```json
{
  "message": "Invalid status value"
}
```

### Server Error

```json
{
  "message": "Failed to create task"
}
```

# Team APIs

# Get Team Members

**GET** `/team-lead/team`

### Description

Returns **all members belonging to the team lead's team**.

Includes additional data such as:

- Active task count
- Leave status
- Experience level
- Skills
- Individual performance score

---

### Example Request

```
GET /team-lead/team
```

---

### Success Response

```json
{
  "members": [
    {
      "_id": "664a3f1e92f33b4c76a1c111",
      "name": "Rahul Sharma",
      "email": "rahul@company.com",
      "phone": "9876543210",
      "role": "employee",
      "experienceLevel": "mid",
      "skills": ["React", "Node.js"],
      "profilePicture": "https://cdn.com/profile.jpg",
      "isActive": true,
      "individualPerformanceScore": 82,
      "activeTasks": 3,
      "isOnLeave": false
    }
  ],
  "metadata": {
    "teamName": "Backend Team",
    "departmentName": "Engineering"
  }
}
```

---

# Get Team Member Performance

**GET** `/team-lead/team/performance`

### Description

Returns **performance metrics for all team members** for the current month.

Performance data includes:

- Task completion score
- Attendance score
- Total performance score

---

### Example Request

```
GET /team-lead/team/performance
```

---

### Success Response

```json
{
  "members": [
    {
      "_id": "664a3f1e92f33b4c76a1c111",
      "name": "Rahul Sharma",
      "email": "rahul@company.com",
      "role": "employee",
      "profilePicture": "https://cdn.com/profile.jpg",
      "individualPerformanceScore": 82,
      "taskCompletionScore": 78,
      "attendanceScore": 90,
      "totalScore": 84,
      "period": "2026-03"
    }
  ],
  "avgScore": 84,
  "period": "2026-03"
}
```

---

# Calculate Team Performance Score

**POST** `/team-lead/team/calculate-score`

### Description

Calculates the **average performance score of all team members**.

The calculated value is stored as:

```
teamPerformanceScore
```

for the logged-in team lead.

Only members with **valid performance scores (>0)** are used in the calculation.

---

### Example Request

```
POST /team-lead/team/calculate-score
```

---

### Success Response

```json
{
  "teamAverage": 76,
  "membersCount": 5,
  "activeMembersCount": 4,
  "message": "Team performance score calculated"
}
```

---

# Error Responses

### Team Not Found

```json
{
  "message": "Failed to fetch team members"
}
```

### Performance Error

```json
{
  "message": "Failed to fetch team performance"
}
```

### Calculation Error

```json
{
  "message": "Failed to calculate team performance score"
}
```

# Ticket APIs

# Get Ticket Statistics

**GET** `/team-lead/tickets/stats`

### Description

Returns **ticket summary statistics for the logged-in team lead**.

Includes:

- Total tickets
- Tickets awaiting assignment
- Tickets in progress
- Resolved tickets
- SLA breached tickets

---

### Example Request

```
GET /team-lead/tickets/stats
```

---

### Success Response

```json
{
  "total": 32,
  "pendingAssignment": 8,
  "inProgress": 14,
  "resolved": 7,
  "slaBreached": 3
}
```

---

# Get My Tickets

**GET** `/team-lead/tickets`

### Description

Returns **all tickets assigned to the team lead**.

Supports filtering by:

```
status
priority
```

---

### Query Parameters

| Parameter | Description |
|-----------|-------------|
| status | Filter tickets by status |
| priority | Filter tickets by priority |

Example:

```
GET /team-lead/tickets?status=OPEN
```

---

### Success Response

```json
[
  {
    "_id": "665c8c29e5c31c0012345678",
    "title": "Payment gateway failure",
    "priority": "HIGH",
    "status": "OPEN",
    "clientId": {
      "name": "John Smith",
      "email": "john@example.com",
      "company": "ABC Ltd"
    },
    "assignedManager": {
      "name": "Project Manager"
    },
    "assignedEmployee": {
      "name": "Rahul Sharma"
    },
    "projectId": {
      "name": "E-Commerce Platform"
    }
  }
]
```

---

# Get Ticket By ID

**GET** `/team-lead/tickets/:id`

### Description

Returns **complete details of a specific ticket**.

Includes:

- Client information
- Manager and employee assignment
- Project information
- Ticket comments

---

### Example Request

```
GET /team-lead/tickets/665c8c29e5c31c0012345678
```

---

### Success Response

```json
{
  "_id": "665c8c29e5c31c0012345678",
  "title": "Payment gateway failure",
  "description": "Users cannot complete checkout",
  "status": "OPEN",
  "priority": "HIGH",
  "clientId": {
    "name": "John Smith",
    "email": "john@example.com",
    "company": "ABC Ltd"
  },
  "assignedEmployee": {
    "name": "Rahul Sharma",
    "email": "rahul@company.com"
  },
  "projectId": {
    "name": "E-Commerce Platform"
  },
  "comments": []
}
```

---

# Assign Employee to Ticket

**PATCH** `/team-lead/tickets/:id/assign-employee`

### Description

Assigns a ticket to an **employee**.

The system:

- Updates ticket status to **ASSIGNED**
- Stores assignment history
- Sends notifications to the employee

---

### Request Body

```json
{
  "employeeId": "664a3f1e92f33b4c76a1c111",
  "note": "Please investigate the issue"
}
```

---

### Success Response

```json
{
  "message": "Ticket assigned to Rahul Sharma",
  "ticket": {
    "_id": "665c8c29e5c31c0012345678",
    "status": "ASSIGNED",
    "assignedEmployee": "664a3f1e92f33b4c76a1c111"
  }
}
```

---

# Add Comment to Ticket

**POST** `/team-lead/tickets/:id/comment`

### Description

Adds a comment to a ticket.

Two types of comments:

```
Internal Comment
Client Comment
```

---

### Request Body

```json
{
  "message": "Working on this issue",
  "isInternal": false
}
```

---

### Behavior

| Comment Type | Visible To |
|---------------|-----------|
| Internal | Manager + Employee |
| External | Client |

---

### Success Response

```json
{
  "message": "Comment added"
}
```

---

# Error Responses

### Ticket Not Found

```json
{
  "message": "Ticket not found"
}
```

### Employee Not Found

```json
{
  "message": "Employee not found"
}
```

### Server Error

```json
{
  "message": "Failed to assign employee"
}
```

# Work Log APIs

# Get Team Work Logs

**GET** `/team-lead/worklogs`

### Description

Returns the **latest work log entries for the team lead and their team members**.

Includes:

- Employee name
- Work date
- Start time
- End time
- Task title
- Category
- Duration

Maximum results returned:

```
100 work log entries
```

Sorted by:

```
date DESC
startTime DESC
```

---

### Example Request

```
GET /team-lead/worklogs
```

---

### Success Response

```json
[
  {
    "_id": "665c8c29e5c31c0012345678",
    "employee": {
      "_id": "664a3f1e92f33b4c76a1c111",
      "name": "Rahul Sharma",
      "email": "rahul@company.com"
    },
    "date": "2026-03-10",
    "startTime": "09:00",
    "endTime": "11:00",
    "durationMinutes": 120,
    "taskTitle": "Implement login API",
    "project": "Employee Portal",
    "category": "development",
    "status": "completed"
  }
]
```

---

# Get Work Log Statistics

**GET** `/team-lead/worklogs/stats`

### Description

Returns **aggregated statistics of team work logs grouped by category**.

Metrics returned:

- Total time spent per category
- Number of entries per category

---

### Example Request

```
GET /team-lead/worklogs/stats
```

---

### Success Response

```json
[
  {
    "_id": "development",
    "totalMinutes": 560,
    "count": 14
  },
  {
    "_id": "meeting",
    "totalMinutes": 180,
    "count": 5
  },
  {
    "_id": "testing",
    "totalMinutes": 210,
    "count": 7
  }
]
```

---

# Get Work Log Analysis

**GET** `/team-lead/worklogs/analysis`

### Description

Returns **advanced work log analytics for the team**.

Includes:

- Time spent analysis
- Productivity breakdown
- Category distribution
- Time range insights

If no date range is provided, the system defaults to:

```
Last 30 days
```

---

### Query Parameters

| Parameter | Description |
|-----------|-------------|
| fromDate | Start date (YYYY-MM-DD) |
| toDate | End date (YYYY-MM-DD) |

Example:

```
GET /team-lead/worklogs/analysis?fromDate=2026-03-01&toDate=2026-03-31
```

---

### Success Response

```json
{
  "fromDate": "2026-03-01",
  "toDate": "2026-03-31",
  "totalHours": 145,
  "totalEntries": 56,
  "categoryBreakdown": [
    {
      "category": "development",
      "hours": 72
    },
    {
      "category": "meeting",
      "hours": 18
    },
    {
      "category": "testing",
      "hours": 25
    }
  ],
  "topEmployees": [
    {
      "name": "Rahul Sharma",
      "hours": 40
    },
    {
      "name": "Anita Verma",
      "hours": 36
    }
  ]
}
```

---
# Error Responses

### Work Logs Not Found

```json
{
  "message": "Failed to fetch work logs"
}
```

### Statistics Error

```json
{
  "message": "Failed to fetch work log stats"
}
```

### Analysis Error

```json
{
  "message": "Failed to fetch work log analysis"
}
```