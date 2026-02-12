# Leave Management System - API Documentation

Base URL: `http://localhost:5001/api`

## Authentication

### Login
- **POST** `/auth/login`
- Body: `{ "email": "...", "password": "..." }`
- Returns: User object + JWT Token

### Profile
- **GET** `/auth/profile`
- Headers: `Authorization: Bearer <token>`
- Returns: Current user profile and leave balance

---

## Leaves

### Apply Leave
- **POST** `/leaves`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "leaveType": "CL/SL/EL/LOP", "fromDate": "YYYY-MM-DD", "toDate": "YYYY-MM-DD", "session": "full-day/half-morning/half-afternoon" }`

### My Leaves
- **GET** `/leaves`
- Headers: `Authorization: Bearer <token>`
- Returns: List of leaves for the authenticated user

### All Leaves (Admin)
- **GET** `/leaves/all?status=pending`
- Headers: `Authorization: Bearer <token>`
- Returns: All leave requests (admin only)

### Update Status (Admin)
- **PUT** `/leaves/:id/status`
- Body: `{ "status": "approved/rejected", "rejectionReason": "..." }`

---

## Holidays

### Get All Holidays
- **GET** `/holidays`
- Returns: List of all public and festival holidays

### Add Holiday (Admin)
- **POST** `/holidays`
- Body: `{ "name": "...", "date": "...", "type": "public/festival", "description": "..." }`

---

## Notifications

### Get My Notifications
- **GET** `/notifications`
- Returns: List of alerts for the user
