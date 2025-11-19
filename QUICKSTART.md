# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Open Your Browser
Navigate to [http://localhost:3000](http://localhost:3000)

### 3. Login with Test Accounts

**Admin Account:**
- Email: `admin@example.com`
- Password: `password123`

**Client Account:**
- Email: `client@example.com`
- Password: `password123`

**Lawyer Accounts:**
- Email: `john.lawyer@example.com` (Corporate Law)
- Password: `password123`

OR

- Email: `sarah.lawyer@example.com` (Family Law)
- Password: `password123`

## 📋 What to Try

### As an Admin:
1. Login with the admin account
2. View system statistics
3. Add new lawyers to the platform
4. Manage all users
5. Monitor appointments and cases

### As a Client:
1. Login with the client account
2. Click "Book New Appointment"
3. Select a lawyer and schedule a consultation
4. View your appointments on the dashboard

### As a Lawyer:
1. Login with a lawyer account
2. View incoming appointment requests
3. See your client cases
4. Manage your schedule

## 🔧 Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Reset database and reseed
npx prisma migrate reset
npm run seed

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 📁 Key Files

- `prisma/schema.prisma` - Database schema
- `lib/auth.ts` - Authentication configuration
- `app/api/` - API endpoints
- `app/dashboard/` - Dashboard pages

## 🎯 Next Steps

1. Customize the UI in the dashboard pages
2. Add video consultation features
3. Integrate Stripe for payments
4. Add email notifications
5. Implement document upload functionality

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Database issues?**
```bash
# Reset database
npx prisma migrate reset
npm run seed
```

**Need to regenerate Prisma Client?**
```bash
npx prisma generate
```
