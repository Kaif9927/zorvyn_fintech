/* eslint-disable no-console */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { prisma } = require('../db');
const { hashPassword, comparePassword } = require('../lib/password');
const { encrypt } = require('../lib/cryptoAtRest');

/** Override with ADMIN_EMAIL / ADMIN_PASSWORD in .env (same vars on Render when seeding). */
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'mohdkaifa909@gmail.com').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12344321';

async function main() {
  // Run seed where env matches the API (e.g. Render Shell). If you seed from your PC
  // against prod DB, copy PASSWORD_PEPPER from Render into backend/.env or hashes won't match login.
  console.log(
    `PASSWORD_PEPPER: ${process.env.PASSWORD_PEPPER ? 'set (must match API server)' : 'not set'}`
  );

  // Must use hashPassword (not raw bcrypt) so PASSWORD_PEPPER matches login/signup.
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  if (!(await comparePassword(ADMIN_PASSWORD, passwordHash))) {
    throw new Error('Seed bug: password hash does not verify with comparePassword');
  }
  const analystHash = await hashPassword('analyst123');
  const viewerHash = await hashPassword('viewer123');

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
      update: {
        password: passwordHash,
        name: 'Mohd Kaifa',
        role: 'Admin',
        status: 'active',
      },
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
    update: { password: analystHash },
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
    update: { password: viewerHash },
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

  const y = new Date().getFullYear();
  const m = new Date().getMonth() + 1;
  await prisma.budget.upsert({
    where: {
      userId_category_year_month: {
        userId: admin.id,
        category: 'Groceries',
        year: y,
        month: m,
      },
    },
    create: {
      userId: admin.id,
      category: 'Groceries',
      amount: 600,
      year: y,
      month: m,
    },
    update: { amount: 600 },
  });
  await prisma.budget.upsert({
    where: {
      userId_category_year_month: {
        userId: admin.id,
        category: 'Rent',
        year: y,
        month: m,
      },
    },
    create: {
      userId: admin.id,
      category: 'Rent',
      amount: 2000,
      year: y,
      month: m,
    },
    update: { amount: 2000 },
  });

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
