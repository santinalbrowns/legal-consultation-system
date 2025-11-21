# Case Creation Workflow

## How Cases Work in the System

Cases are legal matters that are created from confirmed appointments. Here's the complete workflow:

## Step-by-Step Process

### 1. Client Books an Appointment
- Client logs in and navigates to "Book New Appointment"
- Selects a lawyer, provides details, and schedules a time
- Appointment is created with status "PENDING"

### 2. Lawyer Reviews Appointment
- Lawyer logs in and sees the appointment request
- Can view appointment details including client information

### 3. Lawyer Creates a Case
- After reviewing the appointment, lawyer can create a case
- Navigate to: Dashboard → View All Appointments
- Click "Create Case from Appointment" button
- Fill in case details:
  - Case Title (can use appointment title or create new)
  - Detailed case description
- Click "Create Case"

### 4. Case is Created
- Case is created with:
  - Status: "OPEN"
  - Progress: 0%
  - Linked to the original appointment
- Client receives a notification about the new case
- Both lawyer and client can now track the case

### 5. Case Management
- Lawyers can update case progress
- Add case updates and timeline entries
- Upload documents
- Update payment information
- Change case status (OPEN → IN_PROGRESS → CLOSED)

## User Roles and Permissions

### Client Can:
- Book appointments
- View their cases
- Track case progress
- View case updates
- Access case documents

### Lawyer Can:
- View appointments
- Create cases from appointments
- Update case progress
- Add case updates
- Upload documents
- Manage case status

### Admin Can:
- View all appointments
- View all cases
- Monitor system-wide activity
- Add new lawyers to the platform

## Important Notes

- Each appointment can only have ONE case
- Cases cannot be created without an appointment
- Only the lawyer assigned to an appointment can create a case from it
- Clients are automatically notified when a case is created

## Quick Access Links

**For Lawyers:**
- View Appointments: `/dashboard/lawyer/appointments`
- Create Case: Click "Create Case from Appointment" on any appointment

**For Clients:**
- View Cases: `/dashboard/client/cases`
- View Appointments: `/dashboard/client/appointments`

**For Admins:**
- View All Cases: `/dashboard/admin/cases`
- View All Appointments: `/dashboard/admin/appointments`
