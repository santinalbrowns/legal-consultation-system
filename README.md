# Online Legal Consultation System

A modern web application for streamlining legal consultations with features like appointment booking, case tracking, document management, and secure payments.

## Features

- 🔐 **Authentication** - Secure login/registration for clients and lawyers
- 📅 **Appointment Booking** - Easy online scheduling system
- 💼 **Case Management** - Real-time case progress tracking
- 📄 **Document Storage** - Secure document upload and management
- 💳 **Payment Processing** - Automated payment handling (Stripe ready)
- 🔔 **Notifications** - Real-time updates for users
- 👥 **Role-Based Access** - Separate dashboards for clients and lawyers

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
cd legal-consultation-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# .env.local is already created with:
AUTH_SECRET=your-secret-key-change-this-in-production
AUTH_URL=http://localhost:3000
```

4. Generate a secure AUTH_SECRET:
```bash
openssl rand -base64 32
```
Replace the value in `.env.local`

5. Database is already set up with migrations applied

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The application includes the following models:

- **User** - Client, Lawyer, or Admin accounts
- **LawyerProfile** - Extended profile for lawyers
- **Appointment** - Consultation bookings
- **Case** - Legal cases with progress tracking
- **CaseUpdate** - Timeline updates for cases
- **Document** - Secure file storage
- **Payment** - Transaction records
- **Notification** - User notifications

## Usage

### For Clients:
1. Register as a CLIENT
2. Browse available lawyers
3. Book appointments
4. Track case progress
5. Upload documents
6. Manage payments

### For Lawyers:
1. Register as a LAWYER
2. View appointment requests
3. Manage client cases
4. Update case progress
5. Access client documents

## Project Structure

```
legal-consultation-system/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   ├── login/           # Login page
│   ├── register/        # Registration page
│   └── page.tsx         # Landing page
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   └── prisma.ts        # Prisma client
├── prisma/
│   └── schema.prisma    # Database schema
└── types/               # TypeScript types
```

## Future Enhancements

- Video consultation integration (WebRTC)
- Stripe payment integration
- Email notifications
- Document encryption
- Advanced search and filtering
- Calendar integration
- Mobile app

## License

MIT
