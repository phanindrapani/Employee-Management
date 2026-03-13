# Client Ticket APIs

Base URL

```
http://localhost:5000/api/client/tickets
```

Authentication

All endpoints require authentication.

Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

Allowed Roles

```
client
```

These APIs allow clients to:

- Create support tickets
- View their tickets
- Comment on tickets
- Reopen resolved tickets
- View support statistics
- See projects related to them

---

# Get Client Ticket Stats

**GET** `/client/tickets/stats`

### Description

Returns **summary statistics of tickets raised by the client**.

Includes:

- Total tickets
- Open tickets
- In-progress tickets
- Resolved tickets
- Closed tickets
- SLA breached tickets

---

### Example Request

```
GET /api/client/tickets/stats
```

---

### Success Response

```json
{
  "total": 18,
  "open": 5,
  "inProgress": 7,
  "resolved": 4,
  "closed": 2,
  "slaBreached": 1
}
```

---

# Get Client Projects

**GET** `/client/tickets/projects`

### Description

Returns all **projects belonging to the client**.

Used to link tickets with projects.

---

### Example Request

```
GET /api/client/tickets/projects
```

---

### Success Response

```json
[
  {
    "_id": "664a3f1e92f33b4c76a1c111",
    "name": "E-Commerce Platform",
    "status": "ongoing"
  },
  {
    "_id": "664a3f1e92f33b4c76a1c222",
    "name": "Mobile App",
    "status": "completed"
  }
]
```

---

# Get My Tickets

**GET** `/client/tickets`

### Description

Returns **all tickets raised by the logged-in client**.

Supports filtering by:

```
status
priority
category
```

---

### Query Parameters

| Parameter | Description |
|-----------|-------------|
| status | Filter tickets by status |
| priority | Filter tickets by priority |
| category | Filter tickets by category |

Example:

```
GET /api/client/tickets?status=OPEN
```

---

### Success Response

```json
[
  {
    "_id": "665c8c29e5c31c0012345678",
    "title": "Payment issue",
    "priority": "HIGH",
    "status": "OPEN",
    "projectId": {
      "name": "E-Commerce Platform"
    },
    "assignedManager": {
      "name": "Project Manager"
    },
    "assignedTeamLead": {
      "name": "Team Lead"
    },
    "assignedEmployee": {
      "name": "Rahul Sharma"
    }
  }
]
```

---

# Get Ticket By ID

**GET** `/client/tickets/:id`

### Description

Returns **complete details of a specific ticket raised by the client**.

Important behavior:

```
Internal comments are hidden from clients.
```

Only public comments are returned.

---

### Example Request

```
GET /api/client/tickets/665c8c29e5c31c0012345678
```

---

### Success Response

```json
{
  "_id": "665c8c29e5c31c0012345678",
  "title": "Payment gateway issue",
  "description": "Checkout fails when paying with card",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "projectId": {
    "name": "E-Commerce Platform"
  },
  "assignedEmployee": {
    "name": "Rahul Sharma"
  },
  "comments": [
    {
      "userId": {
        "name": "Support Agent",
        "role": "employee"
      },
      "message": "We are investigating the issue."
    }
  ]
}
```

---

# Create Ticket

**POST** `/client/tickets`

### Description

Creates a **new support ticket**.

Attachments can be uploaded with the request.

Uploaded files are stored in:

```
Cloudinary
```

---

### Request Body

```json
{
  "title": "Login issue",
  "description": "Unable to login to dashboard",
  "category": "SUPPORT",
  "priority": "MEDIUM",
  "projectId": "664a3f1e92f33b4c76a1c111"
}
```

Attachments example (multipart form-data):

```
attachments: file1.png
attachments: screenshot.jpg
```

---

### Success Response

```json
{
  "_id": "665c8c29e5c31c0012345678",
  "title": "Login issue",
  "status": "OPEN",
  "priority": "MEDIUM",
  "category": "SUPPORT",
  "attachments": [
    {
      "fileName": "screenshot.png",
      "dataUrl": "https://cloudinary.com/file"
    }
  ]
}
```

---

# Add Comment to Ticket

**POST** `/client/tickets/:id/comment`

### Description

Adds a comment to the ticket.

When a client replies:

```
WAITING_FOR_CLIENT
DOUBT_RAISED
```

status automatically changes to:

```
IN_PROGRESS
```

---

### Request Body

```json
{
  "message": "I have shared the required information."
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

# Reopen Ticket

**PATCH** `/client/tickets/:id/reopen`

### Description

Reopens a ticket that is:

```
RESOLVED
or
CLOSED
```

Reopened tickets move to:

```
REOPENED
```

---

### Request Body

```json
{
  "reason": "Issue still persists after fix"
}
```

---

### Success Response

```json
{
  "message": "Ticket reopened"
}
```
---

# Error Responses

### Invalid Project ID

```json
{
  "message": "Invalid Project ID format"
}
```

### Ticket Not Found

```json
{
  "message": "Ticket not found"
}
```

### Invalid Reopen Request

```json
{
  "message": "Only resolved or closed tickets can be reopened"
}
```

### Server Error

```json
{
  "message": "Failed to create ticket"
}
```