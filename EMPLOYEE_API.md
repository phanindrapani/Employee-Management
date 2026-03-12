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
