# Employee API Documentation

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
  "role": "employee",
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
  "role": "employee",
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
  "role": "employee",
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
  "role": "employee",
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

# Employee Attendance APIs

# Check In

**POST** `/employee/attendance/check-in`

### Description
Allows an employee to **check in for the day**.

Features:

- Prevents multiple check-ins on the same day
- Validates **GPS location**
- Determines **late status**
- Emits real-time socket updates

Late rule:

```
Check-in after 10:30 AM → status = Late
```

Otherwise:

```
status = Present
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
  "latitude": 17.385,
  "longitude": 78.4867
}
```

---

### Request Fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| latitude | number | Yes | User's GPS latitude |
| longitude | number | Yes | User's GPS longitude |

---

### Success Response (200)

```json
{
  "_id": "65attendance123",
  "user": "65user123",
  "date": "2026-03-12T00:00:00.000Z",
  "checkIn": "2026-03-12T09:30:00.000Z",
  "status": "Present",
  "checkInLocation": {
    "latitude": 17.385,
    "longitude": 78.4867
  }
}
```

---

### Error Responses

Already checked in:

```json
{
  "message": "Already checked in for today"
}
```

Outside office location:

```json
{
  "message": "You are outside office range (350m away, allowed 200m)"
}
```

---

# Check Out

**POST** `/employee/attendance/check-out`

### Description
Allows an employee to **check out for the day**.

The system automatically:

- Calculates **working hours**
- Updates **attendance status**

Working hour rules:

```
>= 8 hours → Present
>= 4 hours → Half-Day
< 4 hours → Absent
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
  "latitude": 17.385,
  "longitude": 78.4867
}
```

---

### Success Response

```json
{
  "_id": "65attendance123",
  "checkIn": "2026-03-12T09:00:00.000Z",
  "checkOut": "2026-03-12T18:10:00.000Z",
  "workingHours": 9.17,
  "status": "Present"
}
```

---

### Error Responses

Check-in required:

```json
{
  "message": "Check in first before check out"
}
```

Already checked out:

```json
{
  "message": "Already checked out for today"
}
```

---

# Get Today Attendance

**GET** `/employee/attendance/today`

### Description
Returns today's attendance record for the logged-in user.

If the user has not checked in yet, response will be:

```
null
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /employee/attendance/today
```

---

### Success Response

```json
{
  "_id": "65attendance123",
  "date": "2026-03-12T00:00:00.000Z",
  "status": "Present",
  "checkIn": "2026-03-12T09:00:00.000Z",
  "checkOut": "2026-03-12T18:00:00.000Z",
  "workingHours": 9
}
```

---

# Get My Attendance History

**GET** `/employee/attendance`

### Description
Fetch the **monthly attendance history** of the logged-in employee.

Default:

```
Current month
```

Optional filter:

```
?month=YYYY-MM
```

Example:

```
?month=2026-03
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /employee/attendance?month=2026-03
```

---

### Success Response

```json
[
  {
    "date": "2026-03-12",
    "status": "Present",
    "checkIn": "2026-03-12T09:10:00.000Z",
    "checkOut": "2026-03-12T18:00:00.000Z",
    "workingHours": 8.83
  },
  {
    "date": "2026-03-11",
    "status": "Late",
    "checkIn": "2026-03-11T10:45:00.000Z",
    "checkOut": "2026-03-11T18:00:00.000Z",
    "workingHours": 7.25
  }
]
```

# Employee Document APIs

# Upload Document

**POST** `/employee/documents/upload`

### Description
Allows an employee to upload a document for verification.

After uploading:

- Document is stored in **Cloudinary**
- Status is set to **pending**
- **Admins are notified** for verification

---

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

### Form Data

| Field | Type | Required | Description |
|------|------|----------|-------------|
| file | file | Yes | Document file |
| category | string | Yes | Document category |
| documentName | string | Yes | Name of document |

---

### Allowed Categories

```
education
employment
identity
other
```

---

### Example Request

```
POST /employee/documents/upload
```

Form-data:

```
file: resume.pdf
category: education
documentName: Resume
```

---

### Success Response (201)

```json
{
  "_id": "65doc123",
  "user": "65user123",
  "category": "education",
  "documentName": "Resume",
  "fileUrl": "https://cloudinary.com/document123",
  "originalName": "resume.pdf",
  "verificationStatus": "pending",
  "createdAt": "2026-03-12T10:00:00.000Z"
}
```

---

### Error Responses

File missing:

```json
{
  "message": "No file uploaded"
}
```

Upload failed:

```json
{
  "message": "Failed to upload document"
}
```

---

# Get My Documents

**GET** `/employee/documents`

### Description
Returns all documents uploaded by the logged-in employee.

Documents are sorted by:

```
Newest first
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /employee/documents
```

---

### Success Response (200)

```json
[
  {
    "_id": "65doc123",
    "category": "education",
    "documentName": "Resume",
    "fileUrl": "https://cloudinary.com/document123",
    "verificationStatus": "pending",
    "createdAt": "2026-03-12T10:00:00.000Z"
  },
  {
    "_id": "65doc456",
    "category": "identity",
    "documentName": "Aadhar Card",
    "verificationStatus": "verified"
  }
]
```

---

# Delete Document

**DELETE** `/employee/documents/:id`

### Description
Allows an employee to delete their document.

Restrictions:

```
Employee can only delete their own documents.
Verified documents cannot be deleted.
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
DELETE /employee/documents/65doc123
```

---

### Success Response (200)

```json
{
  "message": "Document deleted successfully"
}
```

---

### Error Responses

Document not found:

```json
{
  "message": "Document not found"
}
```

Not authorized:

```json
{
  "message": "Not authorized to delete this document"
}
```

Verified document restriction:

```json
{
  "message": "Cannot delete verified documents"
}
```

---

# Document Verification Status

| Status | Description |
|------|-------------|
| pending | Awaiting admin verification |
| verified | Approved by admin |
| rejected | Rejected by admin |

---

# Employee Leave APIs

# Apply Leave

**POST** `/employee/leaves`

### Description
Allows an employee to submit a leave request.

Features:

- Validates leave dates
- Calculates total leave days
- Checks leave balance
- Supports attachment upload
- Sends notifications to the approver
- Sends email notification to the approver

Approver logic:

```
Reporting Manager → Primary Approver
If no manager → Admin becomes Approver
```

---

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

### Form Data

| Field | Type | Required | Description |
|------|------|----------|-------------|
| leaveType | string | Yes | Leave type |
| fromDate | date | Yes | Start date of leave |
| toDate | date | Yes | End date of leave |
| session | string | No | Leave session |
| reason | string | Yes | Reason for leave |
| attachment | file | No | Supporting document |

---

### Leave Types

```
CL  → Casual Leave
SL  → Sick Leave
EL  → Earned Leave
LOP → Loss of Pay
```

---

### Session Types

```
full-day
half-morning
half-afternoon
```

---

### Example Request

```
POST /employee/leaves
```

Form-data:

```
leaveType: CL
fromDate: 2026-03-20
toDate: 2026-03-22
session: full-day
reason: Family function
attachment: medical_certificate.pdf
```

---

### Success Response (201)

```json
{
  "_id": "65leave123",
  "user": "65user123",
  "leaveType": "CL",
  "fromDate": "2026-03-20",
  "toDate": "2026-03-22",
  "totalDays": 3,
  "status": "pending",
  "reason": "Family function"
}
```

---

### Error Responses

Invalid date range:

```json
{
  "message": "To date cannot be before From date"
}
```

Past leave request:

```json
{
  "message": "Cannot apply leave for past dates"
}
```

Insufficient balance:

```json
{
  "message": "Insufficient CL balance"
}
```

---

# Get My Leaves

**GET** `/employee/leaves`

### Description
Fetches all leave requests submitted by the logged-in employee.

Results are sorted by:

```
Newest first
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /employee/leaves
```

---

### Success Response (200)

```json
[
  {
    "_id": "65leave123",
    "leaveType": "CL",
    "fromDate": "2026-03-20",
    "toDate": "2026-03-22",
    "totalDays": 3,
    "status": "pending",
    "reason": "Family function"
  },
  {
    "_id": "65leave456",
    "leaveType": "SL",
    "fromDate": "2026-02-10",
    "toDate": "2026-02-11",
    "totalDays": 2,
    "status": "approved"
  }
]
```

---

# Calculate Leave Days

**POST** `/employee/leaves/calculate`

### Description
Calculates the number of **working leave days** between two dates.

This calculation:

- Excludes **Sundays**
- Excludes **Company holidays**
- Considers **half-day sessions**

Used to preview leave duration before applying.

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
  "toDate": "2026-03-22",
  "session": "full-day"
}
```

---

### Success Response

```json
{
  "totalDays": 2
}
```

Example explanation:

```
20 Mar → Working day
21 Mar → Saturday
22 Mar → Sunday (excluded)
Total = 2 days
```

---

### Error Responses

Missing dates:

```json
{
  "message": "From date and To date are required"
}
```

Invalid range:

```json
{
  "message": "To date cannot be before From date"
}
```

---

# Leave Status

| Status | Description |
|------|-------------|
| pending | Awaiting approval |
| approved | Approved by manager/admin |
| rejected | Rejected by approver |

---

# Employee Notification APIs

# Get My Notifications

**GET** `employee/notifications`

### Description
Returns all notifications for the logged-in user.

Notifications are sorted by:

```
Newest first
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET employee/notifications
```

---

### Success Response (200)

```json
[
  {
    "_id": "65notif123",
    "user": "65user123",
    "message": "New Leave Request from Rahul",
    "isRead": false,
    "createdAt": "2026-03-12T10:00:00.000Z"
  },
  {
    "_id": "65notif456",
    "message": "Project assigned to you",
    "isRead": true,
    "createdAt": "2026-03-11T15:30:00.000Z"
  }
]
```

---

# Mark Notification As Read

**PUT** `employee/notifications/:id/read`

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
PUT employee/notifications/65notif123/read
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

# Mark All Notifications As Read

**PUT** `employee/notifications/read-all`

### Description
Marks **all unread notifications** for the logged-in user as **read**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
PUT employee/notifications/read-all
```

---

### Success Response

```json
{
  "message": "All notifications marked as read"
}
```

# Employee Project APIs

# Get My Team Projects

**GET** `/employee/projects`

### Description
Fetches all projects assigned to the **logged-in employee's team**.

Logic used:

```
req.user.team → used to find projects
assignedTeams field in Project collection
```

If the user **does not belong to any team**, the API returns:

```
[]
```

Projects are sorted by:

```
End Date (earliest deadline first)
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /employee/projects
```

---

### Success Response (200)

```json
[
  {
    "_id": "65project123",
    "projectId": "PRJ-001",
    "name": "Employee Management System",
    "description": "Internal HR management platform",
    "status": "ongoing",
    "priority": "high",
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-05-30T00:00:00.000Z",
    "assignedTeams": [
      {
        "_id": "65team123",
        "name": "Backend Team"
      }
    ],
    "progress": 45
  }
]
```

---

### Empty Response Example

If the employee **does not belong to any team**:

```json
[]
```

---

### Error Response

```json
{
  "message": "Failed to fetch projects"
}
```

# Employee Task APIs

# Get My Tasks

**GET** `/employee/tasks`

### Description
Returns all tasks assigned to the logged-in employee.

Tasks are sorted by:

```
deadline (earliest first)
```

Related data included:

- Project name
- Milestone name
- Assigned manager/team lead

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /employee/tasks
```

---

### Success Response

```json
[
  {
    "_id": "65task123",
    "taskId": "PRJ-001-TSK-0001",
    "title": "Build login API",
    "status": "in-progress",
    "progress": 40,
    "priority": "high",
    "deadline": "2026-04-10T00:00:00.000Z",
    "project": {
      "name": "Employee Management System"
    }
  }
]
```

---

# Update Task Content

**PATCH** `/employee/tasks/:id/content`

### Description
Updates the **task content** including:

- Task progress
- Comments
- Attachments

Employees can only update **their own tasks**.

---

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

### Request Body

| Field | Type | Description |
|------|------|-------------|
| progress | number | Task completion percentage |
| comment | string | Comment message |
| file | file | Attachment file |

---

### Example Request

```
PATCH /employee/tasks/65task123/content
```

Form-data:

```
progress: 60
comment: Completed API integration
file: api_code.zip
```

---

### Success Response

```json
{
  "_id": "65task123",
  "title": "Build login API",
  "progress": 60,
  "comments": [
    {
      "user": "65user123",
      "text": "Completed API integration"
    }
  ]
}
```

---

### Error Response

```json
{
  "message": "Not authorized to update this task"
}
```

---

# Update Task Status

**PATCH** `/employee/tasks/:id/status`

### Description
Updates the **status of a task**.

Allowed statuses:

```
todo
in-progress
review
done
```

---

### Status Workflow

```
todo
 → in-progress
 → review
 → done
```

Rules:

```
Employees cannot directly mark tasks as done
Team Lead must approve the task
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
  "status": "review"
}
```

---

### Example Request

```
PATCH /employee/tasks/65task123/status
```

---

### Success Response

```json
{
  "_id": "65task123",
  "status": "review",
  "progress": 80
}
```

---

### Error Responses

Invalid status:

```json
{
  "message": "Invalid status value"
}
```

Unauthorized user:

```json
{
  "message": "Not authorized to update this task"
}
```

Employee trying to mark task done:

```json
{
  "message": "Team lead review is required before marking a task done"
}
```

# Employee Ticket APIs

# Get Ticket Statistics

**GET** `/employee/tickets/stats`

### Description
Returns statistics of tickets assigned to the logged-in employee.

Useful for:

```
Employee dashboard
Support workload tracking
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /employee/tickets/stats
```

---

### Success Response

```json
{
  "total": 12,
  "pending": 3,
  "inProgress": 5,
  "waitingForClient": 1,
  "doubtRaised": 2,
  "resolved": 1
}
```

---

# Get My Tickets

**GET** `/employee/tickets`

### Description
Returns all tickets assigned to the logged-in employee.

Supports optional filters:

```
status
priority
```

Tickets are sorted by:

```
priority (highest first)
createdAt (latest first)
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
| status | string | Filter by ticket status |
| priority | string | Filter by priority |

---

### Example Request

```
GET /employee/tickets?status=IN_PROGRESS
```

---

### Success Response

```json
[
  {
    "_id": "65ticket123",
    "ticketCode": "TKT-1001",
    "title": "Login issue",
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "clientId": {
      "name": "ABC Pvt Ltd"
    },
    "assignedManager": {
      "name": "Rahul Sharma"
    },
    "projectId": {
      "name": "CRM System"
    }
  }
]
```

---

# Get Ticket Details

**GET** `/employee/tickets/:id`

### Description
Fetches detailed information about a specific ticket assigned to the employee.

Includes:

```
Client information
Project details
Manager & Team Lead
Comments
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /employee/tickets/65ticket123
```

---

### Success Response

```json
{
  "_id": "65ticket123",
  "ticketCode": "TKT-1001",
  "title": "Login issue",
  "description": "Unable to login to portal",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "clientId": {
    "name": "ABC Pvt Ltd",
    "email": "support@abc.com"
  },
  "comments": [
    {
      "message": "Investigating issue",
      "role": "employee"
    }
  ]
}
```

---

# Update Ticket Status

**PATCH** `/employee/tickets/:id/status`

### Description
Updates the status of a ticket assigned to the employee.

Allowed statuses:

```
IN_PROGRESS
WAITING_FOR_CLIENT
DOUBT_RAISED
RESOLVED
```

Special behaviors:

```
RESOLVED → adds resolution note and timestamp
DOUBT_RAISED → notifies team lead and manager
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
  "status": "RESOLVED",
  "resolutionNote": "Fixed authentication middleware issue"
}
```

OR

```json
{
  "status": "DOUBT_RAISED",
  "doubtNote": "Need clarification about API requirements"
}
```

---

### Success Response

```json
{
  "message": "Ticket status updated to RESOLVED",
  "ticket": {
    "status": "RESOLVED"
  }
}
```

---

### Error Response

```json
{
  "message": "Status must be one of: IN_PROGRESS, WAITING_FOR_CLIENT, DOUBT_RAISED, RESOLVED"
}
```

---

# Add Comment to Ticket

**POST** `/employee/tickets/:id/comment`

### Description
Adds a comment to a ticket.

Comments can be:

```
Public → visible to client
Internal → visible only to support team
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
  "message": "Please provide server logs",
  "isInternal": false
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

### Error Response

```json
{
  "message": "Ticket not found"
}
```

# Employee Worksheet APIs

# Save Worksheet Entries

**POST** `/employee/worksheet/save`

### Description
Allows employees to **manually save worksheet entries** in bulk.

This endpoint validates:

- Required fields
- Time overlaps
- Duplicate entries

Duplicate rows are automatically skipped.

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
  "entries": [
    {
      "date": "2026-02-18",
      "startTime": "09:00",
      "endTime": "10:30",
      "durationMinutes": 90,
      "taskTitle": "Implement login feature",
      "project": "Auth Module",
      "category": "development",
      "status": "completed",
      "priority": "high",
      "notes": "Used JWT tokens",
      "tags": ["auth", "backend"]
    }
  ]
}
```

---

### Success Response

```json
{
  "message": "2 entries saved successfully.",
  "savedRows": 2,
  "skippedRows": 0
}
```

---

# Import Worksheet File

**POST** `/employee/worksheet/import`

### Description
Imports worksheet entries from a file.

Supported file formats:

```
CSV
JSON
XLSX
DOCX
PDF
```

Features:

```
Duplicate detection
Row validation
Time overlap detection
Bulk processing
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
| file | file | Worksheet file |

---

### Success Response

```json
{
  "message": "Import complete. 45 entries saved.",
  "totalRows": 50,
  "validRows": 45,
  "savedRows": 45,
  "skippedRows": 5,
  "invalidRows": 0
}
```

---

### Error Response

```json
{
  "message": "Unsupported file type"
}
```

---

# Download Worksheet Template

**GET** `/employee/worksheet/template`

### Description
Downloads a worksheet template for importing entries.

Supported formats:

```
csv
json
xlsx
docx
```

---

### Query Parameters

| Parameter | Type | Description |
|----------|------|-------------|
| format | string | Template format |

---

### Example Request

```
GET /employee/worksheet/template?format=csv
```

---

### Response

Downloads template file.

Example CSV template:

```
date,start_time,end_time,duration_minutes,task_title,project,category,status,priority,notes,tags
2026-02-18,09:00,10:30,90,Implement login feature,Auth Module,development,completed,high,Used JWT tokens,auth;backend
```

---

# Get Worksheet Entries

**GET** `/employee/worksheet/entries`

### Description
Fetch worksheet entries for the logged-in employee.

Supports filtering and pagination.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Description |
|----------|------|-------------|
| fromDate | string | Start date |
| toDate | string | End date |
| project | string | Filter by project |
| status | string | Filter by status |
| page | number | Page number |
| limit | number | Results per page |

---

### Example Request

```
GET /employee/worksheet/entries?fromDate=2026-02-01&toDate=2026-02-28
```

---

### Success Response

```json
{
  "entries": [
    {
      "date": "2026-02-18",
      "startTime": "09:00",
      "endTime": "10:30",
      "taskTitle": "Implement login feature",
      "project": "Auth Module",
      "category": "development"
    }
  ],
  "pagination": {
    "total": 20,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

---

# Worksheet Productivity Analysis

**GET** `/employee/worksheet/analysis`

### Description
Provides productivity insights based on worksheet entries.

Metrics include:

```
Total hours worked
Work category breakdown
Daily productivity
Project distribution
```

---

### Query Parameters

| Parameter | Type | Description |
|----------|------|-------------|
| fromDate | string | Analysis start date |
| toDate | string | Analysis end date |

---

### Example Request

```
GET /employee/worksheet/analysis?fromDate=2026-02-01&toDate=2026-02-28
```

---

### Success Response

```json
{
  "fromDate": "2026-02-01",
  "toDate": "2026-02-28",
  "totalEntries": 40,
  "totalHours": 160,
  "categoryBreakdown": {
    "development": 80,
    "meeting": 20,
    "testing": 30,
    "documentation": 30
  }
}
```

---

# Export Worksheet Entries

**GET** `/employee/worksheet/export`

### Description
Exports worksheet entries into downloadable reports.

Supported formats:

```
csv
xlsx
pdf
docx
```

---

### Query Parameters

| Parameter | Type | Description |
|----------|------|-------------|
| format | string | Export format |
| fromDate | string | Start date |
| toDate | string | End date |
| project | string | Project filter |
| status | string | Status filter |

---

### Example Request

```
GET /employee/worksheet/export?format=pdf
```

---

### Response

Downloads worksheet report file.

Example filenames:

```
worksheet_2026-02-18.csv
worksheet_2026-02-18.xlsx
worksheet_2026-02-18.pdf
worksheet_2026-02-18.docx
```

---

# Worksheet Categories

| Category | Description |
|--------|-------------|
| development | Coding tasks |
| design | UI/UX work |
| testing | QA tasks |
| meeting | Meetings |
| documentation | Writing docs |
| research | Investigation work |
| support | Client support |
| other | Miscellaneous |

---

# Worksheet Status

| Status | Description |
|------|-------------|
| completed | Task finished |
| in-progress | Task ongoing |
| blocked | Task blocked |
| pending | Not started |

---

# Real-Time Updates

Socket event triggered when worksheet entries change.

Event:

```
worksheet:updated
```

Payload:

```json
{
  "employeeId": "userId",
  "fromDate": "2026-02-01",
  "toDate": "2026-02-05",
  "changedCount": 5
}
```

Used to update:

```
Timesheet dashboards
Analytics
Employee productivity reports
```