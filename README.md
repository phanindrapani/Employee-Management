# Employee Management System

A comprehensive, role-based management system designed to streamline organizational workflows, ticket management, attendance tracking, and project oversight. This project uses a monorepo architecture with a unified backend and specialized frontend applications for different user roles.

---

## Project Structure 

The repository is organized into several key modules:

- **`server/`**: The central Node.js & Express API backend.
- **`admin/`**: Dashboard for system administrators to manage users, projects, and global settings.
- **`manager/`**: Interface for project managers to oversee teams, projects, and client interactions.
- **`teamlead/`**: Tools for team leaders to manage tasks and team performance.
- **`employee/`**: Portal for employees to log attendance, manage tasks, and apply for leaves.
- **`client/`**: Portal for clients to raise support tickets and view project progress.
- **`worksheet-app/`**: Specialized application for logging daily work and worksheets.

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Real-time**: Socket.io for live notifications
- **Storage**: Cloudinary for file and profile picture uploads
- **Authentication**: JSON Web Tokens (JWT) & BcryptJS
- **NodeMailer**: Sending emails

### Frontend
- **Framework**: React.js
- **Build Tool**: Vite
- **Styling**: Modern CSS / Styled Components (varies by module)
- **Icons**: React Icons / FontAwesome

---

## Role-Based Access Control (RBAC)

The system is built on a strict RBAC model to ensure data security and operational efficiency:

| Role | Key Responsibilities |
| :--- | :--- |
| **Admin** | User management, attendance reports, holiday configuration, and global dashboard. |
| **Manager** | Project planning, client management, team oversight, and performance tracking. |
| **Team Lead** | Task assignment, code reviews, daily standup tracking, and team support. |
| **Employee** | Daily check-in/out, task updates, leave requests, and worksheet logging. |
| **Client** | Raising support tickets, commenting on progress, and viewing project milestones. |

---

## API Documentation

Detailed documentation for each role's API can be found in the root directory:

- [Admin API](https://github.com/phanindrapani/Employee-Management/blob/feature/shravya/ADMIN_API.md)
- [Manager API](https://github.com/phanindrapani/Employee-Management/blob/feature/shravya/MANAGER_API.md)
- [Team Lead API](https://github.com/phanindrapani/Employee-Management/blob/feature/shravya/TEAMLEAD_API.md)
- [Employee API](https://github.com/phanindrapani/Employee-Management/blob/feature/shravya/EMPLOYEE_API.md)
- [Client API](https://github.com/phanindrapani/Employee-Management/blob/feature/shravya//CLIENT_API.md)

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Cloudinary Account (for uploads)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/phanindrapani/Employee-Management.git
   git switch feature/shravya
   cd Employee-Management
   ```

2. **Setup the Server**:
   ```bash
   cd server
   npm install
   # Create a .env file based on .env.example
   npm run dev
   ```

3. **Setup a Frontend (e.g., Admin)**:
   ```bash
   cd ../admin
   npm install
   npm run dev
   ```

---

## Key Features
- **Ticket System**: Full lifecycle management of client support tickets.
- **Attendance Tracking**: Automated daily attendance with LAN IP validation.
- **Leave Management**: Integrated leave application and approval workflow.
- **Project Overviews**: Dashboard with statistics, monthly trends, and deadlines.
- **Real-time Notifications**: Instant updates via Socket.io for milestones and assignments.