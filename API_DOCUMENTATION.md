# Leave Management System - API Documentation

Base URL: `http://localhost:5000/api`

## Authentication & User Profile

### Register User
- **POST** `/auth/register`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "Alex Smith",
  "email": "alex@example.com",
  "password": "securepassword123",
  "role": "employee",
  "phone": "555-0555"
}
```
- **Response** (201 Created):
```json
{
  "_id": "65db7...",
  "name": "Alex Smith",
  "email": "alex@example.com",
  "role": "employee",
  "token": "eyJhbG..."
}
```

### Login
- **POST** `/auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "alex@example.com",
  "password": "securepassword123"
}
```
- **Response**:
```json
{
  "_id": "65db7...",
  "name": "Alex Smith",
  "email": "alex@example.com",
  "role": "employee",
  "token": "eyJhbG..."
}
```

### Get My Profile
- **GET** `/auth/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Full user object, including:
```json
{
  "_id": "65db7...",
  "name": "Alex Smith",
  "email": "alex@example.com",
  "role": "employee",
  "phone": "555-0555",
  "department": { "_id": "65cad...", "name": "Engineering" },
  "team": { "_id": "65db2...", "name": "Team Alpha" },
  "reportingManager": { "_id": "65daf...", "name": "John Lead", "profilePicture": "..." },
  "leaveBalance": { "cl": 12, "sl": 10, "el": 15 },
  "profilePicture": "...",
  "isActive": true
}
```

### Update Profile
- **PUT** `/auth/profile`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Request Body**: (Optional fields)
```json
{
  "name": "Alex G. Smith",
  "phone": "555-0666",
  "profilePicture": "(Binary File)"
}
```
- **Response**: Updated user summary object with a fresh token.

### Change Password
- **POST** `/auth/change-password`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "currentPassword": "securepassword123",
  "newPassword": "newsecurepassword456"
}
```
- **Response**:
```json
{
  "message": "Password updated successfully"
}
```

---

## Employee Records Management

### Add Employee (with Documents)
- **POST** `/admin/employees`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**: (Form-data)
```json
{
  "name": "Jane Wilson",
  "email": "jane@example.com",
  "phone": "555-0888",
  "address": "123 Maple St",
  "qualification": "MBA",
  "cl": 12,
  "sl": 10,
  "el": 15,
  "tenth": "(File)",
  "twelfth": "(File)",
  "degree": "(File)",
  "offerletter": "(File)",
  "joiningletter": "(File)",
  "resume": "(File)",
  "profilePicture": "(File)"
}
```
- **Response** (201 Created):
```json
{
  "message": "Employee added successfully",
  "employee": { ... },
  "defaultPassword": "Jane123"
}
```

### Get All Employee Records
- **GET** `/admin/employees`
- **Response**: Array of detailed employee records.

### Get Employee Record by ID
- **GET** `/admin/employees/:id`
- **Response**: Detailed employee record.

### Update Employee Record
- **PUT** `/admin/employees/:id`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**: (Partial form-data allowed)
- **Response**:
```json
{
  "message": "Employee updated",
  "employee": { ... }
}
```

### Delete Employee Record
- **DELETE** `/admin/employees/:id`
- **Response**:
```json
{
  "message": "Employee removed successfully"
}
```

---

## Employee Document Management

### Get Documents
- **GET** `/admin/documents?userId=65db4...` (admin)
- **GET** `/employee/documents` (employee self)
- **Headers**: `Authorization: Bearer <token>`
- **Note**: Employees see their own documents. Admins see their own by default but can fetch for any user by providing `userId`.
- **Response**: Array of document objects, including `verificationStatus` and `fileUrl`.

### Upload Document
- **POST** `/employee/documents/upload` (employee self)
- **POST** `/admin/documents/upload` (admin)
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Request Body**: (Form-data)
```json
{
  "category": "education",
  "documentName": "Masters Degree",
  "file": "(Binary File)"
}
```
- **Note**: `category` must be one of `education`, `employment`, `identity`, `other`.
- **Response** (201 Created):
```json
{
  "_id": "65db8...",
  "user": "65db4...",
  "category": "education",
  "documentName": "Masters Degree",
  "fileUrl": "...",
  "originalName": "degree_final.pdf",
  "verificationStatus": "pending"
}
```

### Delete Document
- **DELETE** `/employee/documents/:id` (employee own)
- **DELETE** `/admin/documents/:id` (admin)
- **Headers**: `Authorization: Bearer <token>`
- **Note**: Employees can delete their own documents. Admins can delete any.
- **Response**:
```json
{
  "message": "Document deleted successfully"
}
```

### Verify Document (Admin)
- **PUT** `/admin/documents/:id/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `admin`
- **Response**: The updated document object with `verificationStatus: "verified"`.

### Reject Document (Admin)
- **PUT** `/admin/documents/:id/reject`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `admin`
- **Request Body**:
```json
{
  "reason": "File is blurred and unreadable"
}
```
- **Response**: The updated document object with `verificationStatus: "rejected"` and `rejectionReason`.

---

## Admin Analytics

### Dashboard Stats
- **GET** `/admin/stats`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `admin`
- **Response**:
```json
{
  "summary": {
    "employees": 45,
    "teams": 8,
    "departments": 4,
    "projects": {
      "upcoming": 2,
      "ongoing": 5,
      "completed": 12,
      "onHold": 1,
      "total": 20
    },
    "leaves": {
      "pending": 5,
      "approvedThisMonth": 12,
      "rejectedThisMonth": 2
    },
    "holidays": {
      "upcoming": { "name": "Holi", "date": "2024-03-25" },
      "total": 12
    }
  },
  "pendingActions": {
    "leaves": [
      { "_id": "...", "user": { "name": "...", "profilePicture": "..." }, "status": "pending" }
    ],
    "deadlines": [
      { "_id": "...", "name": "Project Alpha", "endDate": "2024-04-01" }
    ]
  },
  "teamPerformance": [
    { "name": "Frontend Team", "lead": "Alice", "members": 5, "activeProjects": 2, "avgProgress": 75 }
  ],
  "recentActivity": [
    { "message": "Bob was assigned to Task X", "time": "2024-03-20T10:00:00Z", "type": "task" }
  ],
  "monthlyTrend": [2, 5, 8, 4, 0, 0, 0, 0, 0, 0, 0, 0],
  "distribution": [
    { "label": "CL", "value": 15 },
    { "label": "SL", "value": 10 }
  ]
}
```

### Report Stats
- **GET** `/admin/reports`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `admin`
- **Response**:
```json
{
  "summary": {
    "totalLeaves": 150,
    "avgDuration": "3.2",
    "mostCommonType": "Casual Leave",
    "utilizationRate": "12.5"
  },
  "monthlyData": [
    { "name": "Jan", "leaves": 12 },
    { "name": "Feb", "leaves": 15 }
  ],
  "employeeStats": [
    { "name": "John Doe", "leaves": 5, "days": 18 }
  ],
  "leaveDistribution": [
    { "name": "Casual Leave", "value": 85 },
    { "name": "Sick Leave", "value": 45 }
  ]
}
```

---

## Employee Management (Admin)

### Create Employee
- **POST** `/admin/employees`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Request Body**:
```json
{
  "name": "Sarah Connor",
  "email": "sarah@Skynet.com",
  "phone": "555-0199",
  "role": "employee",
  "department": "65cad1...",
  "team": "65cad2...",
  "skills": "[\"Defensive Tactics\", \"Heavy Weapons\"]",
  "experienceLevel": "Senior",
  "cl": 12,
  "sl": 10,
  "el": 15,
  "qualification": "B.Sc Computer Science"
}
```
- **Response**:
```json
{
  "message": "Employee created",
  "user": {
    "_id": "65da...",
    "name": "Sarah Connor",
    "email": "sarah@skynet.com",
    "role": "employee",
    "leaveBalance": { "cl": 12, "sl": 10, "el": 15 }
  }
}
```

### Get All Employees
- **GET** `/admin/employees`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
[
  {
    "_id": "65da...",
    "name": "Sarah Connor",
    "email": "sarah@skynet.com",
    "role": "employee",
    "department": { "name": "IT" },
    "team": { "name": "Security" },
    "reportingManager": { "name": "John Connor" }
  }
]
```

### Update Employee
- **PUT** `/admin/employees/:id`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Request Body**: (Partial data allowed)
```json
{
  "role": "team-lead",
  "phone": "9999999999"
}
```
- **Response**:
```json
{
  "message": "Employee updated successfully",
  "user": { ... }
}
```

### Delete Employee
- **DELETE** `/admin/employees/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "message": "Employee deleted"
}
```

---

## Department Management (Admin)

### Create Department
- **POST** `/admin/departments`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Human Resources",
  "description": "Handles employee relations and recruitment"
}
```
- **Response** (201 Created):
```json
{
  "_id": "65cad...",
  "name": "Human Resources",
  "description": "Handles employee relations and recruitment",
  "createdAt": "2024-03-20T10:00:00.000Z",
  "updatedAt": "2024-03-20T10:00:00.000Z"
}
```

### Get All Departments
- **GET** `/admin/departments`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
[
  {
    "_id": "65cad...",
    "name": "Human Resources",
    "description": "Handles employee relations and recruitment"
  },
  {
    "_id": "65cae...",
    "name": "Engineering",
    "description": "Core product development team"
  }
]
```

### Update Department
- **PUT** `/admin/departments/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "description": "Updated description for HR"
}
```
- **Response**: The updated department object.

### Delete Department
- **DELETE** `/admin/departments/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "msg": "Deleted"
}
```

---

## Team Management (Admin)

### Create Team
- **POST** `/admin/teams`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Engineering Team A",
  "department": "65cad...",
  "teamLead": "65daf...",
  "members": ["65db0...", "65db1..."]
}
```
- **Response** (201 Created):
```json
{
  "_id": "65db2...",
  "name": "Engineering Team A",
  "department": "65cad...",
  "teamLead": "65daf...",
  "members": ["65db0...", "65db1..."],
  "createdAt": "2024-03-20T11:00:00.000Z",
  "updatedAt": "2024-03-20T11:00:00.000Z"
}
```

### Get All Teams
- **GET** `/admin/teams`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
[
  {
    "_id": "65db2...",
    "name": "Engineering Team A",
    "department": { "_id": "65cad...", "name": "Engineering" },
    "teamLead": { "_id": "65daf...", "name": "John Lead", "email": "john@example.com" },
    "members": ["65db0...", "65db1..."]
  }
]
```

### Update Team
- **PUT** `/admin/teams/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: (Full or partial update)
```json
{
  "name": "Engineering Team Alpha",
  "teamLead": "65db3..."
}
```
- **Response**: The updated team object, populated with department and teamLead details.

### Manage Team Members
- **PATCH** `/admin/teams/members`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "teamId": "65db2...",
  "memberId": "65db4...",
  "action": "add"
}
```
- **Note**: `action` can be `"add"` or `"remove"`.
- **Response**: The updated team object.

### Delete Team
- **DELETE** `/admin/teams/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "message": "Team deleted"
}
```

---

## Project Management (Admin)

### Create Project
- **POST** `/admin/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Project Titan",
  "description": "Next-gen infrastructure overhaul",
  "status": "upcoming",
  "priority": "high",
  "startDate": "2024-04-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "assignedTeam": "65db2...",
  "progressMode": "auto"
}
```
- **Note**: `progress` is strictly enforced as `0` on creation.
- **Response** (201 Created): Returns the created project object.

### Get All Projects
- **GET** `/admin/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of projects, populated with `assignedTeam` and its `department`.

### Update Project
- **PUT** `/admin/projects/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: (Full or partial update)
```json
{
  "priority": "medium",
  "name": "Project Titan (Revised)"
}
```
- **Note**: Manual `progress` updates are prevented via this route to ensure synchronization with task completion.
- **Response**: The updated project object.

### Update Project Status/Progress
- **PATCH** `/admin/projects/:id/status`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "status": "ongoing",
  "progress": 25
}
```
- **Response**: The updated project object.

### Delete Project
- **DELETE** `/admin/projects/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Note**: Automatically deletes all associated tasks.
- **Response**:
```json
{
  "msg": "Deleted"
}
```

---

## Holiday Management

### Get All Holidays
- **GET** `/holidays`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of holidays, sorted by date.
```json
[
  {
    "_id": "65db5...",
    "name": "Independence Day",
    "date": "2024-08-15T00:00:00.000Z",
    "type": "public",
    "description": "National holiday"
  }
]
```

### Create Holiday (Admin)
- **POST** `/holidays`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `admin`
- **Request Body**:
```json
{
  "name": "Republic Day",
  "date": "2024-01-26",
  "type": "public",
  "description": "National festival"
}
```
- **Response** (201 Created): Returns the created holiday object.

### Delete Holiday (Admin)
- **DELETE** `/holidays/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `admin`
- **Response**:
```json
{
  "message": "Holiday removed"
}
```

---

## Leave Management (Admin)

### Get All Leave Requests
- **GET** `/admin/leaves`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
```json
[
  {
    "_id": "65db6...",
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Engineering",
      "role": "employee"
    },
    "leaveType": "CL",
    "fromDate": "2024-04-10",
    "toDate": "2024-04-12",
    "totalDays": 3,
    "status": "pending",
    "reason": "Family function"
  }
]
```

### Update Leave Status
- **PUT** `/admin/leaves/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "status": "approved",
  "rejectionReason": "" 
}
```
- **Note**: `rejectionReason` should be provided if `status` is `"rejected"`.
- **Response**: Updated leave object.

---

## Performance Module - Reviews (Admin & Team Lead)

### Create Performance Review
- **POST** `/admin/performance/reviews`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `admin`, `team-lead`
- **Request Body**:
```json
{
  "employee": "65db4...",
  "reviewPeriod": "2026-02",
  "rating": 4,
  "feedback": "Consistent high performer",
  "kpis": [
    { "name": "Technical Depth", "score": 9, "comment": "Strong understanding" },
    { "name": "Communication", "score": 8, "comment": "Proactive" }
  ]
}
```
- **Response** (201 Created): Returns the created review object.

### Get Performance Reviews
- **GET** `/admin/performance/reviews?employeeId=65db4...`
- **Headers**: `Authorization: Bearer <token>`
- **Note**: Employees can only see their own reviews. Admin and Team Lead can filter by `employeeId`.
- **Response**: Array of review objects, populated with employee and reviewer details.

---

## Performance Module - Advanced Analytics (Admin)

### Trigger Automated Calculation
- **POST** `/admin/performance/calculate`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `admin`
- **Request Body**:
```json
{
  "period": "2026-02"
}
```
- **Note**: Triggers the scoring engine for all employees for the given month.
- **Response**:
```json
{
  "message": "Performance calculated",
  "count": 45
}
```

### Get Performance Dashboard
- **GET** `/admin/performance/dashboard?period=2026-02`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `admin`
- **Response**:
```json
{
  "summary": {
    "totalEmployees": 45,
    "avgScore": "78.5",
    "topScore": 95
  },
  "topPerformers": [...],
  "needsAttention": [...],
  "distribution": [
    { "name": "John Doe", "score": 92, "tasks": 100, "role": "employee" }
  ]
}
```

---

## Global Settings (Admin)

### Get Global Leave Quotas
- **GET** `/admin/settings/leave`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `admin`
- **Response**:
```json
{
  "key": "leave_quotas",
  "value": {
    "cl": 12,
    "sl": 10,
    "el": 15
  },
  "description": "Global leave quotas for all employees"
}
```

### Update Global Leave Quotas
- **PUT** `/admin/settings/leave`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `admin`
- **Request Body**:
```json
{
  "value": {
    "cl": 15,
    "sl": 12,
    "el": 20
  }
}
```
- **Response**: The updated setting object.

---

## Leave Management (Personal)

### Apply for Leave
- **POST** `/employee/leaves`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Request Body**: (Form-data)
```json
{
  "leaveType": "CL",
  "fromDate": "2024-04-10",
  "toDate": "2024-04-12",
  "session": "full-day",
  "reason": "Family function",
  "attachment": "(File)"
}
```
- **Note**: `leaveType` can be `CL`, `SL`, `EL`, `LOP`. `session` can be `full-day`, `half-morning`, `half-afternoon`.
- **Response** (201 Created): Returns the created leave request object.

### Get My Leave History
- **GET** `/employee/leaves`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of leave request objects belonging to the authenticated user.

### Calculate Leave Duration
- **POST** `/employee/leaves/calculate`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "fromDate": "2024-04-10",
  "toDate": "2024-04-12",
  "session": "full-day"
}
```
- **Note**: This calculates working days excluding Sundays and holidays.
- **Response**:
```json
{
  "totalDays": 3
}
```

---

## Notification Management

### Get My Notifications
- **GET** `/employee/notifications` (employee)
- **GET** `/team-lead/notifications` (team lead)
- **GET** `/admin/notifications` (admin)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of notification objects, sorted by most recent.
```json
[
  {
    "_id": "65db9...",
    "user": "65db4...",
    "message": "Your leave request for 3 day(s) has been approved.",
    "isRead": false,
    "createdAt": "2024-03-20T14:00:00.000Z"
  }
]
```

### Mark Notification as Read
- **PUT** `/employee/notifications/:id/read` (employee)
- **PUT** `/team-lead/notifications/:id/read` (team lead)
- **PUT** `/admin/notifications/:id/read` (admin)
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "message": "Notification marked as read"
}
```

### Mark All Notifications as Read
- **PUT** `/employee/notifications/read-all` (employee)
- **PUT** `/team-lead/notifications/read-all` (team lead)
- **PUT** `/admin/notifications/read-all` (admin)
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "message": "All notifications marked as read"
}
```

---

## Task Management

### Create Task (Team Lead)
- **POST** `/team-lead/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `team-lead`
- **Request Body**:
```json
{
  "project": "65cad...",
  "title": "Design Database Schema",
  "description": "Create the initial ERD and schema for the auth module",
  "assignedTo": "65db4...",
  "deadline": "2024-04-15",
  "priority": "high",
  "weight": 2
}
```
- **Note**: `priority` must be one of `low`, `medium`, `high`, `urgent`. `weight` defaults to 1.
- **Response** (201 Created): Returns the created task object.

### Get My Tasks
- **GET** `/employee/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of tasks assigned to the authenticated user, sorted by deadline.

### Get Team Tasks (Team Lead)
- **GET** `/team-lead/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `team-lead`
- **Response**: Array of tasks assigned to all members of the lead's team.

### Update Task Status
- **PATCH** `/employee/tasks/:id/status` (employee self)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "status": "in-progress"
}
```
- **Note**: `status` must be one of `todo`, `in-progress`, `review`, `done`. Authorized for the assigned user or their team lead. Triggers performance score recalculation upon completion.
- **Response**: The updated task object.

### Update Task (Team Lead)
- **PUT** `/team-lead/tasks/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `team-lead`
- **Request Body**: Any editable task fields (for example `title`, `description`, `assignedTo`, `deadline`, `priority`, `weight`, `status`).
- **Response**: The updated task object.

### Delete Task (Team Lead)
- **DELETE** `/team-lead/tasks/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `team-lead`
- **Response**:
```json
{
  "message": "Task deleted successfully"
}
```

---

## Worksheet Module (Employee)

### Import Worksheet File
- **POST** `/employee/worksheet/import`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Role**: `employee`
- **Form Body**:
```json
{
  "file": "(CSV|JSON|XLSX|DOCX|PDF file)"
}
```
- **Response**:
```json
{
  "message": "Import complete. 8 entries saved.",
  "totalRows": 10,
  "validRows": 8,
  "savedRows": 8,
  "invalidRows": 2,
  "errors": [
    { "row": 5, "field": "startTime", "message": "Invalid time format: \"25:99\" (expected HH:MM)" }
  ],
  "parseErrors": [],
  "warning": "PDF parsing is template-dependent. For best results, use the official worksheet template."
}
```

### Download Worksheet Template
- **GET** `/employee/worksheet/template?format=csv|json|xlsx|docx`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `employee`
- **Response**: File download in requested format.

### Get Imported Worksheet Entries
- **GET** `/employee/worksheet/entries?fromDate=2026-02-01&toDate=2026-02-28&project=EMS&status=completed&page=1&limit=20`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `employee`
- **Response**:
```json
{
  "entries": [
    {
      "_id": "6999...",
      "date": "2026-02-18",
      "startTime": "09:00",
      "endTime": "10:30",
      "durationMinutes": 90,
      "taskTitle": "Implement login feature",
      "project": "Auth Module",
      "category": "development",
      "status": "completed",
      "priority": "high"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### Worksheet Analysis
- **GET** `/employee/worksheet/analysis?fromDate=2026-02-01&toDate=2026-02-28`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `employee`
- **Response**:
```json
{
  "fromDate": "2026-02-01",
  "toDate": "2026-02-28",
  "totalHours": 42.5,
  "productiveHours": 31.5,
  "nonProductiveHours": 11,
  "tasksCompleted": 18,
  "completionRatio": 72,
  "avgTaskDuration": 85,
  "topProjects": [
    { "name": "EMS", "hours": 22.5, "tasks": 10 }
  ],
  "topCategories": [
    { "name": "development", "hours": 20, "tasks": 8 }
  ],
  "trend": [
    { "date": "2026-02-18", "hours": 6.5, "tasks": 4 }
  ]
}
```

### Export Worksheet Entries
- **GET** `/employee/worksheet/export?format=csv|xlsx|pdf|docx&fromDate=2026-02-01&toDate=2026-02-28&project=EMS&status=completed`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `employee`
- **Response**: File download in requested format.

---

## Team Leadership & Management

### Get Team Dashboard Stats
- **GET** `/team-lead/stats`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `team-lead`
- **Response**:
```json
{
  "teamSize": 5,
  "activeProjects": 2,
  "pendingTasks": 12,
  "onLeaveToday": 0,
  "pendingApprovals": 12,
  "weeklyProductivity": 85
}
```

### Get Team Members
- **GET** `/team-lead/team`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `team-lead`
- **Note**: Returns list of members with their current `activeTasks` count (workload).
- **Response**: Array of member objects.

### Get Team Leave Calendar
- **GET** `/team-lead/leaves`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `team-lead`
- **Response**: Array of leave objects for all team members.

### Update Team Leave Status
- **PUT** `/team-lead/leaves/:id/status`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `team-lead`
- **Request Body**:
```json
{
  "status": "approved"
}
```
- **Response**: Updated leave request object.

### Get Team Projects
- **GET** `/team-lead/projects`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `team-lead`
- **Response**: Array of project objects assigned to the lead's team.

### Update Project Progress
- **PUT** `/team-lead/projects/:id/progress`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `team-lead`, `admin`
- **Request Body**:
```json
{
  "mode": "manual",
  "progress": 75
}
```
- **Note**: `mode` can be `manual` (overrides with `progress` value) or `auto` (calculates based on task completion).
- **Response**: The updated project object.

### Get Team Reports
- **GET** `/team-lead/reports`
- **Headers**: `Authorization: Bearer <token>`
- **Role**: `team-lead`
- **Response**: Team performance/report payload for the authenticated lead.
