# DayFlow - Human Resource Management System

#### Team Members:

1. Team Leader: Amit Prajapati (Frontend Developer)
- GitHub: https://github.com/amitprajapati0702/

2. Backend Developer: Aryan Pandya
- GitHub: https://github.com/a7ryan

3. Database API Integration: Ayush Shah
- GitHub: https://github.com/ayush971 

---

### Purpose of the Project

The Dayflow HRMS is a digital solution designed to streamline core HR operations. The goal is to replace manual processes with an automated system for employee onboarding, profile management, attendance tracking, and payroll visibility.

---

### Functional Requirements

- `Authentication`: Secure Sign Up and Sign In using Employee ID and Email.
- `Role-Based Access`: Distinct permissions for Admin/HR Officers and Employees.
- `Attendance Tracking`: Real-time Check-in/Check-out system with status types like Present / Absent /on Leave.
- `Leave Management`: A complete workflow for applying, approving, or rejecting time-off requests.
- `Profile Management`: Centralized storage for personal details, job roles, and documents.
- `Payroll Visibility`: Secure access to salary structures and payroll accuracy controls.

---

### User Roles

- **Admin / HR Officer**
- Manages the employee database.
- Approves or rejects leave and attendance requests.
- Full access to payroll management and employee details.

- **Employee**
- Personal dashboard for quick access to profile and leave status.
- Daily/Weekly attendance tracking.
- Read-only access to personal salary details.

---

### System Modules

#### 1. Authentication & Authorization
- `Sign Up`: Users register with Employee ID, Email, and Password.
- `Role Selection`: Users choose between Employee or HR roles.
- `Security`: Email verification and password validation are required.

#### 2. Dashboard Interface
- `Employee View`: Features quick-access cards for Profile, Attendance, and Leave.
- `Admin View`: Displays organization-wide metrics including employee lists and pending approvals.

#### 3. Attendance Management
- `Tracking`: Support for daily and weekly views.
- `Permissions`: Employees view personal logs; Admins monitor the entire workforce.

#### 4. Leave & Time-Off
- `Application`: Employees select type (`Paid`, `Sick`, `Unpaid`) and date range.
- `Workflow`: Requests transition through `Pending`, `Approved`, or `Rejected` states.
- `Admin Control`: Admins can add comments during the approval process.

#### 5. Payroll & Salary
- `Employee View`: Read-only access to personal salary structure.
- `Admin Control`: Ability to update structures and ensure organizational payroll accuracy.

---

### Installation & Setup

#### Clone the Repo
`git clone https://github.com/YourUsername/Dayflow-HRMS.git`

#### Prerequisites
- `Git` installed for version control.
- `Node.js` or your specific backend environment.
- `Database` configuration (ensure your local environment matches the `.env` settings).
- `Config` please create and change .env.local file and review .env.example for reference.
- <strong> Admin/HR Email: `admin@dayflow.com` | Password: `adminpassword` </strong>
- Note: This credentials would be stored as encrypted base64 format.

#### Commands
1. `npm install` (to install project dependencies)
2. `npm run dev` (to start the development server)

---

### Future Enhancements

- `Notifications`: Automated email and system alerts for leave approvals.
- `Analytics`: A dedicated dashboard for HR to track workforce trends and turnover.


### Project Images

1. Signin (Admin/HR)

![signin](https://github.com/amitprajapati0702/OdooXGCET/blob/main/images/signin.jpeg)



2. Signup Page

![signin](https://github.com/amitprajapati0702/OdooXGCET/blob/main/images/signup.jpeg)



3. Employees Page

![signin](https://github.com/amitprajapati0702/OdooXGCET/blob/main/images/employees.jpeg)


4. Employees Salary

![signin](https://github.com/amitprajapati0702/OdooXGCET/blob/main/images/emp-salary.jpeg)


5. Employees Details

![signin](https://github.com/amitprajapati0702/OdooXGCET/blob/main/images/emp-details.jpeg)


6. Leave Allocation Page

![signin](https://github.com/amitprajapati0702/OdooXGCET/blob/main/images/allocation.jpeg)


7. Attendance Page

![signin](https://github.com/amitprajapati0702/OdooXGCET/blob/main/images/attandence.jpeg)


8. Checkin Status

![signin](https://github.com/amitprajapati0702/OdooXGCET/blob/main/images/checkin-status.jpeg)


9. Time off Page

![signin](https://github.com/amitprajapati0702/OdooXGCET/blob/main/images/time-off.jpeg)
