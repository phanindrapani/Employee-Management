# Employee Management System API Documentation

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


# Admin APIs

## Daily Attendance Report

**GET** `/admin/attendance`

### Description
Fetches the daily attendance report for all users with roles **employee** and **team-lead**.

Only accessible by users with the **admin role**.

If a user does not have an attendance record for the selected date, the system automatically marks them as **Absent**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string | No | Target date in `YYYY-MM-DD` format. Defaults to current date if not provided |

---

### Example Request

```
GET /admin/attendance?date=2026-03-12
```

---

### Success Response (200 OK)

```json
{
  "date": "2026-03-12",
  "summary": {
    "Present": 5,
    "Late": 1,
    "Half-Day": 1,
    "Absent": 3
  },
  "records": [
    {
      "user": {
        "_id": "65de123abc",
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "role": "employee",
        "department": "65dep123",
        "team": "65team123"
      },
      "date": "2026-03-12T00:00:00.000Z",
      "status": "Present",
      "checkIn": "2026-03-12T09:10:00.000Z",
      "checkOut": "2026-03-12T18:05:00.000Z",
      "workingHours": 8
    }
  ]
}
```

---

### Response Fields

| Field | Type | Description |
|------|------|-------------|
| date | string | Attendance date |
| summary | object | Count of attendance statuses |
| records | array | List of attendance records |
| user | object | User information |
| status | string | Attendance status |
| checkIn | datetime | Check-in time |
| checkOut | datetime | Check-out time |
| workingHours | number | Total working hours |

---

### Attendance Status Types

| Status | Description |
|------|-------------|
| Present | User checked in normally |
| Late | User checked in late |
| Half-Day | User worked half day |
| Absent | No attendance record |

---

### Error Responses

Invalid date format

```json
{
  "message": "Invalid date format. Use YYYY-MM-DD."
}
```

Server error

```json
{
  "message": "Failed to fetch daily attendance"
}
```

# Admin Client Management APIs

All endpoints in this section require **Admin authentication**.

Base Path:

```
/admin/clients
```

Middleware used:

```
protect
authorizeRole(['admin'])
```

---

# Get All Clients

**GET** `/admin/clients`

### Description
Returns a list of all registered clients sorted by **latest created first**.

### Headers

```
Authorization: Bearer <token>
```

### Example Request

```
GET /admin/clients
```

### Success Response (200)

```json
[
  {
    "_id": "65f1abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "company": "ABC Pvt Ltd",
    "role": "client",
    "clientCode": "CLT-123456",
    "profilePicture": "https://cloudinary.com/image.jpg",
    "isActive": true,
    "createdAt": "2026-03-12T10:00:00.000Z"
  }
]
```

### Error Response

```json
{
  "error": "Server error message"
}
```

---

# Get Client By ID

**GET** `/admin/clients/:id`

### Description
Returns details of a specific client.

### Headers

```
Authorization: Bearer <token>
```

### Example Request

```
GET /admin/clients/65f1abc123
```

### Success Response

```json
{
  "_id": "65f1abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "company": "ABC Pvt Ltd",
  "role": "client",
  "clientCode": "CLT-123456",
  "profilePicture": "https://cloudinary.com/image.jpg",
  "isActive": true
}
```

### Error Response

```json
{
  "message": "Client not found"
}
```

---

# Add Client

**POST** `/admin/clients`

### Description
Creates a new client account.

The system automatically:
- Generates a **default password**
- Generates a **clientCode**
- Uploads profile picture to **Cloudinary**

Default password format:

```
<FirstName>123
```

Example:

```
John123
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
|------|------|---------|-------------|
| name | string | Yes | Client name |
| email | string | Yes | Client email |
| phone | string | Yes | Mobile number |
| company | string | No | Company name |
| profilePicture | file | No | Profile image |

---

### Example Request

```
POST /admin/clients
```

Form Data:

```
name: John Doe
email: john@example.com
phone: 9876543210
company: ABC Pvt Ltd
profilePicture: image file
```

---

### Success Response (201)

```json
{
  "_id": "65f1abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "company": "ABC Pvt Ltd",
  "role": "client",
  "clientCode": "CLT-123456",
  "profilePicture": "https://cloudinary.com/profile.jpg",
  "isActive": true
}
```

---

### Error Response

```json
{
  "message": "User already exists for this email"
}
```

---

# Update Client

**PUT** `/admin/clients/:id`

### Description
Updates client details.

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

### Form Data

| Field | Type | Description |
|------|------|-------------|
| name | string | Client name |
| email | string | Client email |
| phone | string | Mobile number |
| company | string | Company name |
| isActive | boolean | Activate / deactivate client |
| profilePicture | file | New profile image |

---

### Example Request

```
PUT /admin/clients/65f1abc123
```

Form Data:

```
name: John Doe
company: XYZ Solutions
isActive: true
```

---

### Success Response

```json
{
  "_id": "65f1abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "company": "XYZ Solutions",
  "role": "client",
  "clientCode": "CLT-123456",
  "profilePicture": "https://cloudinary.com/profile.jpg",
  "isActive": true
}
```

---

### Error Response

```json
{
  "message": "Client not found"
}
```

---

# Delete Client

**DELETE** `/admin/clients/:id`

### Description
Deletes a client account permanently.

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
DELETE /admin/clients/65f1abc123
```

---

### Success Response

```json
{
  "message": "Client deleted successfully"
}
```

---

### Error Response

```json
{
  "message": "Client not found"
}
```

# Admin Dashboard APIs

All endpoints in this section require **Admin authentication**.

Middleware used:

```
protect
authorizeRole(['admin'])
```

---

# Get Dashboard Statistics

**GET** `/admin/stats`

### Description
Returns the **admin dashboard overview data** including:

- Global system summary
- Pending leave approvals
- Upcoming project deadlines
- Team performance statistics
- Recent task activity
- Monthly trends
- Data distribution for charts

This API is mainly used for **admin dashboard UI widgets and charts**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /admin/stats
```

---

### Success Response (200)

```json
{
  "summary": {
    "totalEmployees": 50,
    "activeProjects": 12,
    "completedProjects": 20,
    "pendingTasks": 15
  },
  "pendingActions": {
    "leaves": [
      {
        "_id": "65abc123",
        "user": {
          "name": "Rahul Sharma",
          "profilePicture": "https://image-url"
        },
        "status": "pending"
      }
    ],
    "deadlines": [
      {
        "_id": "65proj123",
        "name": "Mobile App Development",
        "endDate": "2026-03-25T00:00:00.000Z",
        "assignedTeams": [
          {
            "_id": "65team123",
            "name": "Backend Team"
          }
        ]
      }
    ]
  },
  "teamPerformance": [
    {
      "_id": "65team123",
      "name": "Backend Team",
      "lead": "John Doe",
      "members": 6,
      "activeProjects": 3,
      "avgProgress": 75
    }
  ],
  "recentActivity": [
    {
      "message": "John Doe was assigned to \"Fix API bug\"",
      "time": "2026-03-10T10:00:00.000Z",
      "type": "task"
    }
  ],
  "monthlyTrend": [],
  "distribution": []
}
```

---

### Response Fields

| Field | Type | Description |
|------|------|-------------|
| summary | object | Overall system metrics |
| pendingActions | object | Pending leaves and upcoming deadlines |
| teamPerformance | array | Team productivity stats |
| recentActivity | array | Recent system activity |
| monthlyTrend | array | Monthly statistical trend |
| distribution | array | Data distribution for charts |

---

### Error Response

```json
{
  "message": "Failed to fetch dashboard stats"
}
```

---

# Get Report Statistics

**GET** `/admin/reports`

### Description
Returns **analytical reports related to employee leaves** including:

- Total leaves taken
- Average leave duration
- Monthly leave statistics
- Top employees by leave usage
- Leave type distribution

Used for **admin analytics dashboards and reports**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /admin/reports
```

---

### Success Response (200)

```json
{
  "summary": {
    "totalLeaves": 120,
    "avgDuration": 2.3,
    "mostCommonType": "Casual Leave",
    "utilizationRate": 45.5
  },
  "monthlyData": [
    {
      "name": "Jan",
      "leaves": 10
    },
    {
      "name": "Feb",
      "leaves": 8
    }
  ],
  "employeeStats": [
    {
      "name": "Rahul Sharma",
      "leaves": 5,
      "days": 12
    }
  ],
  "leaveDistribution": [
    {
      "name": "Casual Leave",
      "value": 25
    },
    {
      "name": "Sick Leave",
      "value": 15
    }
  ]
}
```

---

### Response Fields

| Field | Type | Description |
|------|------|-------------|
| summary | object | Overall leave statistics |
| monthlyData | array | Monthly leave trend |
| employeeStats | array | Top employees by leave usage |
| leaveDistribution | array | Leave type distribution |

---

### Error Response

```json
{
  "message": "Failed to fetch report stats"
}
```

# Admin Department Management APIs

All endpoints in this section require **Admin authentication**.

Middleware used:

```
protect
authorizeRole(['admin'])
```

---

# Create Department

**POST** `/admin/departments`

### Description
Creates a new department in the system.

The system automatically generates a **Department ID (`deptId`)** in the format:

```
DEPT-001
DEPT-002
DEPT-003
```

using an internal counter.

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
  "name": "Engineering",
  "description": "Handles software development",
  "createdBy": "65abc123456"
}
```

---

### Success Response (201)

```json
{
  "_id": "65dep123",
  "deptId": "DEPT-001",
  "name": "Engineering",
  "description": "Handles software development",
  "createdBy": "65abc123456",
  "createdAt": "2026-03-12T10:00:00.000Z",
  "updatedAt": "2026-03-12T10:00:00.000Z"
}
```

---

### Error Response

```json
{
  "msg": "Department already exists"
}
```

---

# Get All Departments

**GET** `/admin/departments`

### Description
Returns a list of all departments in the organization.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /admin/departments
```

---

### Success Response

```json
[
  {
    "_id": "65dep123",
    "deptId": "DEPT-001",
    "name": "Engineering",
    "description": "Handles software development",
    "createdAt": "2026-03-12T10:00:00.000Z"
  },
  {
    "_id": "65dep456",
    "deptId": "DEPT-002",
    "name": "Human Resources",
    "description": "Manages employee relations"
  }
]
```

---

# Update Department

**PUT** `/admin/departments/:id`

### Description
Updates an existing department.

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
  "name": "Product Engineering",
  "description": "Responsible for product development"
}
```

---

### Example Request

```
PUT /admin/departments/65dep123
```

---

### Success Response

```json
{
  "_id": "65dep123",
  "deptId": "DEPT-001",
  "name": "Product Engineering",
  "description": "Responsible for product development"
}
```

---

### Error Response

```json
{
  "msg": "Department not found"
}
```

---

# Delete Department

**DELETE** `/admin/departments/:id`

### Description
Deletes a department from the system.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
DELETE /admin/departments/65dep123
```

---

### Success Response

```json
{
  "msg": "Deleted"
}
```

---

### Error Response

```json
{
  "msg": "Department not found"
}
```

# Admin Document Management APIs

All endpoints in this section require **Admin authentication**.

Middleware used:

```
protect
authorizeRole(['admin'])
```

File uploads use **multipart/form-data** and are processed using **Multer**.

Supported file types:

- Images
- PDF
- DOCX

Maximum file size:

```
5 MB
```

---

# Get Documents

**GET** `/admin/documents`

### Description
Fetches documents uploaded by a specific user.

If no `userId` query parameter is provided, it fetches documents belonging to the **authenticated user**.

Admins can fetch documents of any user by passing `userId`.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Required | Description |
|----------|------|----------|-------------|
| userId | string | No | User ID whose documents should be fetched |

---

### Example Request

```
GET /admin/documents?userId=65abc123
```

---

### Success Response (200)

```json
[
  {
    "_id": "65doc123",
    "user": "65abc123",
    "category": "Education",
    "documentName": "Degree Certificate",
    "fileUrl": "https://cloudinary.com/document.pdf",
    "originalName": "degree.pdf",
    "verificationStatus": "pending",
    "createdAt": "2026-03-12T10:00:00.000Z"
  }
]
```

---

# Upload Document

**POST** `/admin/documents/upload`

### Description
Uploads a new employee document.

Files are uploaded to **Cloudinary** and stored with metadata.

Verification status defaults to:

```
pending
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
| file | file | Yes | Document file |
| category | string | Yes | Document category |
| documentName | string | Yes | Display name for the document |

---

### Example Request

```
POST /admin/documents/upload
```

Form Data:

```
file: degree.pdf
category: Education
documentName: Bachelor's Degree
```

---

### Success Response (201)

```json
{
  "_id": "65doc123",
  "user": "65abc123",
  "category": "Education",
  "documentName": "Bachelor's Degree",
  "fileUrl": "https://cloudinary.com/documents/degree.pdf",
  "originalName": "degree.pdf",
  "verificationStatus": "pending",
  "createdAt": "2026-03-12T10:00:00.000Z"
}
```

---

### Error Response

```json
{
  "message": "No file uploaded"
}
```

---

# Verify Document

**PUT** `/admin/documents/:id/verify`

### Description
Marks a document as **verified**.

Verification metadata is recorded including:

- `verifiedBy`
- `verifiedAt`

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
PUT /admin/documents/65doc123/verify
```

---

### Success Response

```json
{
  "_id": "65doc123",
  "verificationStatus": "verified",
  "verifiedBy": "65admin123",
  "verifiedAt": "2026-03-12T11:00:00.000Z"
}
```

---

### Error Response

```json
{
  "message": "Document not found"
}
```

---

# Reject Document

**PUT** `/admin/documents/:id/reject`

### Description
Rejects a document submission and stores the rejection reason.

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
  "reason": "Document is blurry"
}
```

---

### Example Request

```
PUT /admin/documents/65doc123/reject
```

---

### Success Response

```json
{
  "_id": "65doc123",
  "verificationStatus": "rejected",
  "verifiedBy": "65admin123",
  "verifiedAt": "2026-03-12T11:10:00.000Z",
  "rejectionReason": "Document is blurry"
}
```

---

### Error Responses

Missing rejection reason

```json
{
  "message": "Rejection reason is required"
}
```

Document not found

```json
{
  "message": "Document not found"
}
```

---

# Delete Document

**DELETE** `/admin/documents/:id`

### Description
Deletes a document from the system.

Admins can delete any document.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
DELETE /admin/documents/65doc123
```

---

### Success Response

```json
{
  "message": "Document deleted successfully"
}
```

---

### Error Response

```json
{
  "message": "Document not found"
}
```

# Admin Employee Management APIs

All endpoints in this section require **Admin authentication**.

File uploads use **multipart/form-data**.

Supported upload fields:

- profilePicture
- tenth
- twelfth
- degree
- offerletter
- joiningletter
- resume

---

# Get Employees

**GET** `/admin/employees`

### Description
Returns a list of employees. Admins can also filter by role.

Roles supported:

```
employee
manager
team-lead
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Required | Description |
|----------|------|----------|-------------|
| role | string | No | Filter employees by role |

---

### Example Request

```
GET /admin/employees?role=employee
```

---

### Success Response (200)

```json
[
  {
    "_id": "65emp123",
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "role": "employee",
    "phone": "9876543210",
    "department": {
      "_id": "65dep123",
      "name": "Engineering"
    },
    "team": {
      "_id": "65team123",
      "name": "Backend Team"
    },
    "reportingManager": {
      "_id": "65mgr123",
      "name": "John Manager"
    },
    "createdAt": "2026-03-12T10:00:00.000Z"
  }
]
```

---

# Get Employee By ID

**GET** `/admin/employees/:id`

### Description
Fetches details of a specific employee.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /admin/employees/65emp123
```

---

### Success Response

```json
{
  "_id": "65emp123",
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "role": "employee",
  "phone": "9876543210",
  "department": {
    "_id": "65dep123",
    "name": "Engineering"
  },
  "team": {
    "_id": "65team123",
    "name": "Backend Team"
  },
  "reportingManager": {
    "_id": "65mgr123",
    "name": "John Manager"
  }
}
```

---

### Error Response

```json
{
  "message": "Employee not found"
}
```

---

# Add Employee

**POST** `/admin/employees`

### Description
Creates a new employee account.

The system automatically:

- Generates a **default password**
- Uploads profile and document files to **Cloudinary**
- Assigns **leave balances**
- Creates employee UID

Default password format:

```
<FirstName>123
```

Example:

```
Rahul123
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
| name | string | Yes | Employee name |
| email | string | Yes | Employee email |
| phone | string | Yes | Mobile number |
| role | string | No | employee / manager / team-lead |
| department | string | No | Department ID |
| team | string | No | Team ID |
| reportingManager | string | No | Manager ID |
| qualification | string | No | Qualification |
| experienceLevel | string | No | Junior / Mid / Senior / Intern |
| skills | string | No | JSON array or comma-separated |
| cl | number | No | Casual leave quota |
| sl | number | No | Sick leave quota |
| el | number | No | Earned leave quota |
| profilePicture | file | No | Profile image |
| tenth | file | No | 10th certificate |
| twelfth | file | No | 12th certificate |
| degree | file | No | Degree certificate |
| offerletter | file | No | Offer letter |
| joiningletter | file | No | Joining letter |
| resume | file | No | Resume |

---

### Example Request

```
POST /admin/employees
```

Form Data:

```
name: Rahul Sharma
email: rahul@example.com
phone: 9876543210
department: 65dep123
team: 65team123
skills: ["Node.js","MongoDB"]
profilePicture: image file
resume: resume.pdf
```

---

### Success Response (201)

```json
{
  "message": "Employee added successfully",
  "employee": {
    "_id": "65emp123",
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "role": "employee"
  },
  "defaultPassword": "Rahul123"
}
```

---

### Error Response

```json
{
  "message": "User already exists for this email"
}
```

---

# Update Employee

**PUT** `/admin/employees/:id`

### Description
Updates employee details.

This endpoint can:

- Update employee information
- Update skills
- Update leave balance
- Upload new documents
- Promote employee to another role

---

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

---

### Example Request

```
PUT /admin/employees/65emp123
```

Form Data:

```
role: manager
skills: ["Node.js","System Design"]
cl: 15
profilePicture: new-image.jpg
```

---

### Success Response

```json
{
  "message": "Employee updated",
  "employee": {
    "_id": "65emp123",
    "name": "Rahul Sharma",
    "role": "manager"
  }
}
```

---

### Error Response

```json
{
  "error": "Employee not found"
}
```

---

# Delete Employee

**DELETE** `/admin/employees/:id`

### Description
Deletes an employee account permanently.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
DELETE /admin/employees/65emp123
```

---

### Success Response

```json
{
  "message": "Employee removed successfully"
}
```

---

### Error Response

```json
{
  "message": "Employee not found"
}
```

# Admin Holiday Management APIs

Authentication:

- **GET Holidays** → Any authenticated user
- **Create/Delete Holidays** → Admin only

Middleware used:

```
protect
authorizeRole(['admin'])
```

---

# Get All Holidays

**GET** `admin/holidays`

### Description
Fetches all holidays configured in the system.  
Accessible to **all authenticated users**.

Holidays are sorted by **date ascending**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /admin/holidays
```

---

### Success Response (200)

```json
[
  {
    "_id": "65hol123",
    "name": "Republic Day",
    "date": "2026-01-26T00:00:00.000Z",
    "type": "public",
    "description": "National holiday"
  },
  {
    "_id": "65hol456",
    "name": "Diwali",
    "date": "2026-11-08T00:00:00.000Z",
    "type": "festival",
    "description": "Festival of lights"
  }
]
```

---

# Create Holiday

**POST** `admin/holidays`

### Description
Creates a new holiday entry.

Only **Admin users** are allowed to create holidays.

The system prevents multiple holidays on the same date.

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
  "name": "Diwali",
  "date": "2026-11-08",
  "type": "festival",
  "description": "Festival of lights"
}
```

---

### Request Fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Holiday name |
| date | date | Yes | Holiday date |
| type | string | Yes | `public` or `festival` |
| description | string | No | Holiday description |

---

### Success Response (201)

```json
{
  "_id": "65hol456",
  "name": "Diwali",
  "date": "2026-11-08T00:00:00.000Z",
  "type": "festival",
  "description": "Festival of lights",
  "createdAt": "2026-03-12T10:00:00.000Z",
  "updatedAt": "2026-03-12T10:00:00.000Z"
}
```

---

### Error Responses

Invalid date

```json
{
  "message": "Invalid holiday date"
}
```

Duplicate holiday

```json
{
  "message": "A holiday already exists on this date"
}
```

---

# Delete Holiday

**DELETE** `admin/holidays/:id`

### Description
Deletes a holiday entry from the system.

Only **Admin users** are allowed to delete holidays.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
DELETE admin/holidays/65hol123
```

---

### Success Response

```json
{
  "msg": "Deleted"
}
```

---

### Error Response

```json
{
  "msg": "Failed"
}
```

# Admin Leave Management APIs

# Get All Leave Requests

**GET** `/admin/leaves`

### Description
Fetches all leave requests that the admin is authorized to view.

The API returns:

- Leave requests submitted by managers
- Leave requests from employees reporting to the admin

Results are sorted by **latest request first**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /admin/leaves
```

---

### Success Response (200)

```json
[
  {
    "_id": "65leave123",
    "user": {
      "_id": "65emp123",
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "department": "Engineering",
      "role": "employee"
    },
    "leaveType": "CL",
    "fromDate": "2026-03-20T00:00:00.000Z",
    "toDate": "2026-03-21T00:00:00.000Z",
    "totalDays": 2,
    "session": "full-day",
    "status": "pending",
    "reason": "Personal work",
    "createdAt": "2026-03-12T10:00:00.000Z"
  }
]
```

---

# Update Leave Status

**PUT** `/admin/leaves/:id`

### Description
Updates the status of a leave request.

Possible status values:

```
approved
rejected
```

When a leave is approved:

- Leave balance is deducted from the employee
- Email notification is sent
- Real-time socket events are triggered

If a previously approved leave is rejected later, the leave balance is restored.

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
  "status": "approved"
}
```

or

```json
{
  "status": "rejected",
  "rejectionReason": "Project deadline approaching"
}
```

---

### Example Request

```
PUT /admin/leaves/65leave123
```

---

### Success Response

```json
{
  "_id": "65leave123",
  "status": "approved",
  "leaveType": "CL",
  "totalDays": 2,
  "balanceApplied": true
}
```

---

### Error Responses

Leave not found

```json
{
  "message": "Leave request not found"
}
```

Insufficient leave balance

```json
{
  "message": "Insufficient CL balance"
}
```

---

# Reconcile Leave Balances

**POST** `/admin/leaves/reconcile-balances`

### Description
Recalculates leave balances for previously approved leave requests.

This API is used when:

- Leave balances were not applied correctly
- System migration occurred
- Data inconsistency exists

The system will:

1. Find approved leave requests where `balanceApplied = false`
2. Deduct leave days from the user's leave balance
3. Mark those leave records as applied

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
POST /admin/leaves/reconcile-balances
```

---

### Success Response

```json
{
  "message": "Leave balance reconciliation completed",
  "updatedLeaves": 8,
  "skippedLeaves": 2
}
```

---

### Error Response

```json
{
  "msg": "Reconciliation failed"
}
```

# Performance Analytics APIs

# Trigger Performance Calculation

**POST** `/admin/performance/calculate`

### Description
Triggers performance calculation for all employees and team leads for a given period.

The system calculates:

- Task completion score
- On-time delivery score
- Attendance score
- Team contribution score

These are combined into a **weighted total performance score**.

Weights used in scoring:

| Metric | Weight |
|------|------|
| Task completion | 60% |
| On-time completion | 10% |
| Attendance | 10% |
| Team contribution | 20% |

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
  "period": "2026-02"
}
```

Period format:

```
YYYY-MM
```

---

### Example Request

```
POST /admin/performance/calculate
```

---

### Success Response

```json
{
  "message": "Performance calculated",
  "count": 45
}
```

---

### Error Response

```json
{
  "message": "Calculation failed"
}
```

---

# Get Admin Performance Dashboard

**GET** `/admin/performance/dashboard`

### Description
Returns organization-wide performance analytics including:

- Team performance statistics
- Organization average score
- Top performers
- Teams needing attention

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Required | Description |
|------|------|------|-------------|
| period | string | Yes | Performance period (`YYYY-MM`) |

---

### Example Request

```
GET /admin/performance/dashboard?period=2026-02
```

---

### Success Response

```json
{
  "summary": {
    "totalTeams": 5,
    "orgAvgScore": 72,
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
      "avgScore": 75,
      "highestScore": 90,
      "needsAttention": 1
    }
  ],
  "topPerformers": [
    {
      "_id": "65metric123",
      "user": {
        "_id": "65emp123",
        "name": "Amit Kumar",
        "role": "employee"
      },
      "totalScore": 92
    }
  ]
}
```

---

# Get Employee Performance Profile

**GET** `/admin/performance/employee/:id`

### Description
Returns detailed performance data for a specific employee including:

- Current performance score
- Historical performance data (last 6 periods)

Accessible by:

```
admin
manager
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Required | Description |
|------|------|------|-------------|
| period | string | Yes | Performance period (`YYYY-MM`) |

---

### Example Request

```
GET /admin/performance/employee/65emp123?period=2026-02
```

---

### Success Response

```json
{
  "current": {
    "user": "65emp123",
    "period": "2026-02",
    "tasksAssigned": 20,
    "tasksCompleted": 18,
    "onTimeTasks": 15,
    "attendanceDays": 20,
    "workingDays": 22,
    "taskCompletionScore": 90,
    "onTimeScore": 83,
    "attendanceScore": 91,
    "teamContributionScore": 70,
    "totalScore": 86,
    "category": "Excellent"
  },
  "history": [
    {
      "period": "2025-12",
      "totalScore": 78
    },
    {
      "period": "2026-01",
      "totalScore": 82
    }
  ]
}
```

# Admin Project Management APIs

# Create Project

**POST** `/admin/projects`

### Description
Creates a new project in the system.

The system automatically:

- Generates a **projectId**
- Sets initial progress to **0**
- Assigns the admin as **createdBy**
- Sends real-time notifications to the assigned **Project Manager**

Project ID format:

```
PRJ-001
PRJ-002
PRJ-003
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
  "name": "Employee Management System",
  "description": "Internal HR management platform",
  "priority": "high",
  "startDate": "2026-04-01",
  "endDate": "2026-06-30",
  "managerId": "65mgr123",
  "assignedTeams": ["65team123"],
  "clientId": "65client123"
}
```

---

### Request Fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Project name |
| description | string | No | Project description |
| priority | string | No | low / medium / high |
| startDate | date | No | Project start date |
| endDate | date | No | Project deadline |
| managerId | ObjectId | No | Assigned project manager |
| assignedTeams | array | No | Team IDs assigned to the project |
| clientId | ObjectId | No | Client associated with the project |

---

### Success Response (201)

```json
{
  "_id": "65proj123",
  "projectId": "PRJ-001",
  "name": "Employee Management System",
  "status": "upcoming",
  "priority": "high",
  "progress": 0,
  "createdBy": "65admin123"
}
```

---

### Error Response

```json
{
  "msg": "Failed to create project"
}
```

---

# Get All Projects

**GET** `/admin/projects`

### Description
Fetches all projects in the system.

Results include populated fields:

- Project Manager
- Assigned Teams
- Client information

Sorted by **latest created first**.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /admin/projects
```

---

### Success Response (200)

```json
[
  {
    "_id": "65proj123",
    "projectId": "PRJ-001",
    "name": "Employee Management System",
    "status": "ongoing",
    "priority": "high",
    "progress": 45,
    "managerId": {
      "_id": "65mgr123",
      "name": "Rahul Sharma",
      "email": "rahul@example.com"
    },
    "assignedTeams": [
      {
        "_id": "65team123",
        "name": "Backend Team"
      }
    ],
    "clientId": {
      "_id": "65client123",
      "name": "ABC Corp"
    }
  }
]
```

---

# Update Project

**PUT** `/admin/projects/:id`

### Description
Updates project details such as:

- Name
- Description
- Priority
- Manager
- Assigned teams
- Client

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Example Request

```
PUT /admin/projects/65proj123
```

```json
{
  "name": "HR Management Platform",
  "priority": "medium"
}
```

---

### Success Response

```json
{
  "_id": "65proj123",
  "name": "HR Management Platform",
  "priority": "medium"
}
```

---

### Error Response

```json
{
  "msg": "Failed"
}
```

---

# Update Project Status

**PATCH** `/admin/projects/:id/status`

### Description
Updates project **status** and optionally **progress**.

Status values:

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
Content-Type: application/json
```

---

### Request Body

```json
{
  "status": "ongoing",
  "progress": 60
}
```

---

### Example Request

```
PATCH /admin/projects/65proj123/status
```

---

### Success Response

```json
{
  "_id": "65proj123",
  "status": "ongoing",
  "progress": 60
}
```

---

# Delete Project

**DELETE** `/admin/projects/:id`

### Description
Deletes a project from the system.

When a project is deleted:

- All related **tasks are also deleted**
- Real-time notifications are sent to assigned teams

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
DELETE /admin/projects/65proj123
```

---

### Success Response

```json
{
  "msg": "Deleted"
}
```

---

### Error Response

```json
{
  "msg": "Failed"
}
```

# Admin Settings APIs

# Get Leave Settings

**GET** `/admin/settings/leave`

### Description
Fetches the global leave quota settings used for employees.

If no settings exist in the database, the system automatically creates default values.

Default quotas:

```
CL: 12
SL: 10
EL: 15
```

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /admin/settings/leave
```

---

### Success Response (200)

```json
{
  "_id": "65settings123",
  "key": "leave_quotas",
  "value": {
    "cl": 12,
    "sl": 10,
    "el": 15
  },
  "description": "Global leave quotas for all employees",
  "createdAt": "2026-03-12T10:00:00.000Z",
  "updatedAt": "2026-03-12T10:00:00.000Z"
}
```

---

# Update Leave Settings

**PUT** `/admin/settings/leave`

### Description
Updates the global leave quota settings for employees.

These values will be used when:

- New employees are created
- Leave balances are initialized
- Leave calculations are performed

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
  "value": {
    "cl": 14,
    "sl": 12,
    "el": 18
  }
}
```

---

### Request Fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| value.cl | number | Yes | Casual Leave quota |
| value.sl | number | Yes | Sick Leave quota |
| value.el | number | Yes | Earned Leave quota |

---

### Example Request

```
PUT /admin/settings/leave
```

---

### Success Response (200)

```json
{
  "_id": "65settings123",
  "key": "leave_quotas",
  "value": {
    "cl": 14,
    "sl": 12,
    "el": 18
  },
  "description": "Global leave quotas for all employees"
}
```

---

### Error Response

```json
{
  "message": "Failed to update leave settings"
}
```

# Admin Team Management APIs

# Create Team

**POST** `/admin/teams`

### Description
Creates a new team within a department.

The system automatically:

- Generates a **teamId**
- Assigns **team lead and manager roles**
- Updates reporting structure
- Assigns members to the team
- Sends real-time notifications

Team ID format:

```
TEAM-001
TEAM-002
TEAM-003
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
  "name": "Backend Team",
  "department": "65dep123",
  "teamLead": "65user123",
  "manager": "65user456",
  "members": [
    "65user789",
    "65user999"
  ]
}
```

---

### Request Fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Team name |
| department | ObjectId | Yes | Department ID |
| teamLead | ObjectId | No | Team lead user ID |
| manager | ObjectId | No | Manager user ID |
| members | array | No | List of team member IDs |

---

### Success Response (201)

```json
{
  "_id": "65team123",
  "teamId": "TEAM-001",
  "name": "Backend Team",
  "department": "65dep123",
  "teamLead": "65user123",
  "manager": "65user456",
  "members": ["65user789","65user999"]
}
```

---

### Error Response

```json
{
  "message": "Team name already exists in this department"
}
```

---

# Get All Teams

**GET** `/admin/teams`

### Description
Returns all teams in the system.

Includes populated information for:

- Department
- Team Lead
- Manager

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /admin/teams
```

---

### Success Response (200)

```json
[
  {
    "_id": "65team123",
    "teamId": "TEAM-001",
    "name": "Backend Team",
    "department": {
      "_id": "65dep123",
      "name": "Engineering"
    },
    "teamLead": {
      "_id": "65user123",
      "name": "Rahul Sharma",
      "email": "rahul@example.com"
    },
    "manager": {
      "_id": "65user456",
      "name": "Anil Kumar",
      "email": "anil@example.com"
    }
  }
]
```

---

# Update Team

**PUT** `/admin/teams/:id`

### Description
Updates team information including:

- Team name
- Department
- Team lead
- Manager
- Members

The system also updates:

- Reporting manager relationships
- User roles
- Team assignments

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Example Request

```
PUT /admin/teams/65team123
```

```json
{
  "name": "Platform Engineering Team",
  "teamLead": "65user222",
  "manager": "65user456",
  "members": [
    "65user333",
    "65user444"
  ]
}
```

---

### Success Response

```json
{
  "_id": "65team123",
  "name": "Platform Engineering Team",
  "teamLead": {
    "_id": "65user222",
    "name": "Amit Kumar"
  },
  "manager": {
    "_id": "65user456",
    "name": "Anil Kumar"
  }
}
```

---

# Manage Team Members

**PATCH** `/admin/teams/members`

### Description
Adds or removes members from a team.

---

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Request Body

Add member

```json
{
  "teamId": "65team123",
  "memberId": "65user999",
  "action": "add"
}
```

Remove member

```json
{
  "teamId": "65team123",
  "memberId": "65user999",
  "action": "remove"
}
```

---

### Success Response

```json
{
  "_id": "65team123",
  "members": [
    "65user333",
    "65user444"
  ]
}
```

---

### Error Response

```json
{
  "message": "Team not found"
}
```

---

# Delete Team

**DELETE** `/admin/teams/:id`

### Description
Deletes a team from the system.

When a team is deleted:

- Team members are detached
- Team lead role is reverted to **employee**
- Real-time events are emitted

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
DELETE /admin/teams/65team123
```

---

### Success Response

```json
{
  "message": "Team deleted"
}
```

---

### Error Response

```json
{
  "message": "Failed to delete team"
}
```

# Admin Ticket Management APIs


# Ticket Analytics

**GET** `/admin/tickets/analytics`

### Description
Returns ticket statistics and analytics including:

- Ticket counts by status
- Tickets by priority
- Tickets by category
- SLA breaches
- Average resolution time

---

### Headers

```
Authorization: Bearer <token>
```

---

### Example Request

```
GET /admin/tickets/analytics
```

---

### Success Response (200)

```json
{
  "summary": {
    "total": 120,
    "open": 10,
    "assigned": 15,
    "inProgress": 20,
    "waitingForClient": 5,
    "resolved": 40,
    "closed": 25,
    "reopened": 5,
    "slaBreached": 3
  },
  "byPriority": {
    "LOW": 10,
    "MEDIUM": 40,
    "HIGH": 30,
    "CRITICAL": 5
  },
  "byCategory": {
    "BUG": 50,
    "FEATURE": 20,
    "SUPPORT": 40,
    "OTHER": 10
  },
  "avgResolutionHours": 12.4
}
```

---

# Get All Tickets

**GET** `/admin/tickets`

### Description
Fetch paginated tickets with filtering options.

---

### Headers

```
Authorization: Bearer <token>
```

---

### Query Parameters

| Parameter | Type | Description |
|------|------|-------------|
| status | string | Filter by ticket status |
| priority | string | Filter by priority |
| category | string | Filter by category |
| assignedManager | string | Filter by manager ID |
| search | string | Search by ticketCode or title |
| page | number | Page number |
| limit | number | Records per page |

---

### Example Request

```
GET /admin/tickets?status=OPEN&page=1&limit=20
```

---

### Success Response

```json
{
  "tickets": [
    {
      "_id": "65ticket123",
      "ticketCode": "TKT-1001",
      "title": "Login page bug",
      "status": "OPEN",
      "priority": "HIGH",
      "clientId": {
        "name": "ABC Corp"
      }
    }
  ],
  "total": 120,
  "page": 1,
  "pages": 6
}
```

---

# Get Ticket By ID

**GET** `/admin/tickets/:id`

### Description
Fetch full details of a specific ticket including:

- Client information
- Assigned manager
- Assigned team lead
- Assigned employee
- Comments
- Assignment history

---

### Example Request

```
GET /admin/tickets/65ticket123
```

---

### Success Response

```json
{
  "_id": "65ticket123",
  "ticketCode": "TKT-1001",
  "title": "Login page bug",
  "description": "Error when logging in",
  "status": "OPEN",
  "priority": "HIGH",
  "clientId": {
    "name": "ABC Corp",
    "email": "client@example.com"
  },
  "comments": [
    {
      "message": "We are investigating",
      "role": "admin"
    }
  ]
}
```

---

# Get Unassigned Tickets

**GET** `/admin/tickets/unassigned`

### Description
Returns tickets that are **OPEN but not yet assigned to a manager**.

---

### Example Request

```
GET /admin/tickets/unassigned
```

---

### Success Response

```json
[
  {
    "ticketCode": "TKT-1002",
    "title": "API error",
    "priority": "CRITICAL",
    "clientId": {
      "name": "XYZ Ltd"
    }
  }
]
```

---

# Get SLA Breached Tickets

**GET** `/admin/tickets/sla-breached`

### Description
Returns tickets where the **SLA deadline has been exceeded**.

---

### Example Request

```
GET /admin/tickets/sla-breached
```

---

### Success Response

```json
[
  {
    "ticketCode": "TKT-1003",
    "title": "Payment issue",
    "priority": "HIGH",
    "slaBreached": true
  }
]
```

---

# Assign Manager to Ticket

**PATCH** `/admin/tickets/:id/assign-manager`

### Description
Assigns a **Manager** to a ticket.

The system will:

- Change ticket status to **ASSIGNED**
- Record assignment history
- Send real-time notifications
- Create notification for the manager

---

### Request Body

```json
{
  "managerId": "65manager123",
  "note": "Assigning to backend manager"
}
```

---

### Success Response

```json
{
  "message": "Ticket assigned to manager Rahul",
  "ticket": {
    "ticketCode": "TKT-1001",
    "status": "ASSIGNED"
  }
}
```

---

# Close Ticket

**PATCH** `/admin/tickets/:id/close`

### Description
Closes a ticket.

Conditions:

```
Ticket must be RESOLVED before closing.
```

---

### Example Request

```
PATCH /admin/tickets/65ticket123/close
```

---

### Success Response

```json
{
  "message": "Ticket closed",
  "ticket": {
    "status": "CLOSED"
  }
}
```

---

# Add Comment to Ticket

**POST** `/admin/tickets/:id/comment`

### Description
Adds a comment to a ticket.

Comments can be:

- **Public** → visible to client
- **Internal** → visible only to support team

---

### Request Body

```json
{
  "message": "Investigating the issue",
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

