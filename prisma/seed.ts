import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create sample lawyers
  const lawyer1Password = await bcrypt.hash('password123', 10)
  const lawyer1 = await prisma.user.create({
    data: {
      email: 'john.lawyer@example.com',
      password: lawyer1Password,
      name: 'John Smith',
      role: 'LAWYER',
      phone: '+1234567890',
      lawyerProfile: {
        create: {
          specialization: 'Corporate Law',
          experience: 10,
          licenseNumber: 'LAW-001',
          bio: 'Experienced corporate lawyer with 10 years of practice',
          hourlyRate: 250,
          availability: 'Mon-Fri 9AM-5PM',
        },
      },
    },
  })

  const lawyer2Password = await bcrypt.hash('password123', 10)
  const lawyer2 = await prisma.user.create({
    data: {
      email: 'sarah.lawyer@example.com',
      password: lawyer2Password,
      name: 'Sarah Johnson',
      role: 'LAWYER',
      phone: '+1234567891',
      lawyerProfile: {
        create: {
          specialization: 'Family Law',
          experience: 8,
          licenseNumber: 'LAW-002',
          bio: 'Compassionate family law attorney',
          hourlyRate: 200,
          availability: 'Mon-Fri 10AM-6PM',
        },
      },
    },
  })

  // Create sample client
  const clientPassword = await bcrypt.hash('password123', 10)
  const client = await prisma.user.create({
    data: {
      email: 'client@example.com',
      password: clientPassword,
      name: 'Mike Client',
      role: 'CLIENT',
      phone: '+1234567892',
    },
  })

  // Create admin user
  const adminPassword = await bcrypt.hash('password123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      phone: '+1234567893',
    },
  })

  console.log('✅ Seed data created successfully!')
  console.log('\nLogin credentials:')
  console.log('Admin: admin@example.com / password123')
  console.log('Lawyer 1: john.lawyer@example.com / password123')
  console.log('Lawyer 2: sarah.lawyer@example.com / password123')
  console.log('Client: client@example.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
