/* eslint-disable no-console */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { prisma } = require('../db');
const { encrypt } = require('../lib/cryptoAtRest');

const ADMIN_EMAIL = 'mohdkaifa909@gmail.com';
const ADMIN_PASSWORD = '12344321';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const analystHash = await bcrypt.hash('analyst123', 12);
  const viewerHash = await bcrypt.hash('viewer123', 12);

  const oldAdmin = await prisma.user.findUnique({
    where: { email: 'admin@zorvyn.local' },
  });

  let admin;
  if (oldAdmin) {
    admin = await prisma.user.update({
      where: { id: oldAdmin.id },
      data: {
        email: ADMIN_EMAIL.toLowerCase(),
        password: passwordHash,
        name: 'Mohd Kaifa',
        role: 'Admin',
        status: 'active',
      },
    });
  } else {
    admin = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL.toLowerCase() },
      update: { password: passwordHash, name: 'Mohd Kaifa' },
      create: {
        name: 'Mohd Kaifa',
        email: ADMIN_EMAIL.toLowerCase(),
        password: passwordHash,
        role: 'Admin',
        status: 'active',
      },
    });
  }

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@zorvyn.local' },
    update: {},
    create: {
      name: 'Marcus Chen',
      email: 'analyst@zorvyn.local',
      password: analystHash,
      role: 'Analyst',
      status: 'active',
    },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@zorvyn.local' },
    update: {},
    create: {
      name: 'Sofia Reed',
      email: 'viewer@zorvyn.local',
      password: viewerHash,
      role: 'Viewer',
      status: 'active',
    },
  });

  const noteSample = encrypt('Sample seed data');
  const noteAnalyst = encrypt('Analyst record');
  const noteTools = encrypt('Tools');

  const count = await prisma.financialRecord.count({
    where: { userId: admin.id, is_deleted: false },
  });

  if (count === 0) {
    const now = new Date();
    const samples = [
      { amount: 480, type: 'income', category: 'Salary', day: -120 },
      { amount: 120, type: 'expense', category: 'Groceries', day: -115 },
      { amount: 95, type: 'expense', category: 'Transport', day: -110 },
      { amount: 210, type: 'income', category: 'Freelance', day: -90 },
      { amount: 65, type: 'expense', category: 'Dining', day: -85 },
      { amount: 1500, type: 'income', category: 'Salary', day: -60 },
      { amount: 320, type: 'expense', category: 'Rent', day: -55 },
      { amount: 88, type: 'expense', category: 'Subscriptions', day: -40 },
      { amount: 175, type: 'income', category: 'Investments', day: -25 },
      { amount: 42, type: 'expense', category: 'Coffee', day: -10 },
    ];

    for (const row of samples) {
      const d = new Date(now);
      d.setDate(d.getDate() + row.day);
      await prisma.financialRecord.create({
        data: {
          amount: row.amount,
          type: row.type,
          category: row.category,
          date: d,
          note: noteSample,
          userId: admin.id,
        },
      });
    }

    await prisma.financialRecord.createMany({
      data: [
        {
          amount: 400,
          type: 'income',
          category: 'Consulting',
          date: new Date(now.getFullYear(), now.getMonth(), 5),
          note: noteAnalyst,
          userId: analyst.id,
        },
        {
          amount: 150,
          type: 'expense',
          category: 'Software',
          date: new Date(now.getFullYear(), now.getMonth(), 8),
          note: noteTools,
          userId: analyst.id,
        },
      ],
    });
  }

  console.log('Seed complete. Logins:');
  console.log(`  Admin   ${ADMIN_EMAIL.toLowerCase()} / ${ADMIN_PASSWORD}`);
  console.log('  Analyst analyst@zorvyn.local / analyst123');
  console.log('  Viewer  viewer@zorvyn.local / viewer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
