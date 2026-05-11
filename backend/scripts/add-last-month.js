/* eslint-disable no-console */
/**
 * Insert a varied set of income / expense records for the *previous* calendar month
 * against the seeded admin user. Idempotent: skips if the admin already has
 * records in that month.
 *
 * Run: node scripts/add-last-month.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { prisma } = require('../db');
const { encrypt } = require('../lib/cryptoAtRest');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'mohdkaifa909@gmail.com')
  .toLowerCase()
  .trim();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    throw new Error(`Admin user '${ADMIN_EMAIL}' not found. Run the seed first.`);
  }

  const today = new Date();
  const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const month = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
  const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const lastDay = monthEnd.getDate();

  console.log(
    `Target month: ${monthStart.toISOString().slice(0, 7)} (1..${lastDay}) for ${admin.email}`
  );

  const existing = await prisma.financialRecord.count({
    where: {
      userId: admin.id,
      is_deleted: false,
      date: { gte: monthStart, lte: monthEnd },
    },
  });
  if (existing >= 10) {
    console.log(`Skipped: month already has ${existing} records (>= 10).`);
    return;
  }
  if (existing > 0) {
    console.log(`Topping up: ${existing} records already exist; adding more.`);
  }

  const samples = [
    { day: 1,  amount: 65000, type: 'income',  category: 'Salary',        note: 'Monthly salary credit' },
    { day: 3,  amount: 2500,  type: 'expense', category: 'Groceries',     note: 'Weekly grocery run' },
    { day: 4,  amount: 850,   type: 'expense', category: 'Transport',     note: 'Cab + metro' },
    { day: 6,  amount: 1200,  type: 'expense', category: 'Dining',        note: 'Weekend dinner' },
    { day: 8,  amount: 18000, type: 'expense', category: 'Rent',          note: 'Monthly rent' },
    { day: 10, amount: 9000,  type: 'income',  category: 'Freelance',     note: 'Side project invoice' },
    { day: 12, amount: 450,   type: 'expense', category: 'Coffee',        note: 'Coffee runs' },
    { day: 14, amount: 2800,  type: 'expense', category: 'Groceries',     note: 'Mid-month restock' },
    { day: 16, amount: 1500,  type: 'expense', category: 'Subscriptions', note: 'Netflix + Spotify + AWS' },
    { day: 18, amount: 700,   type: 'expense', category: 'Transport',     note: 'Fuel' },
    { day: 20, amount: 3500,  type: 'expense', category: 'Shopping',      note: 'Clothing' },
    { day: 22, amount: 4500,  type: 'income',  category: 'Investments',   note: 'Dividend payout' },
    { day: 24, amount: 950,   type: 'expense', category: 'Health',        note: 'Pharmacy' },
    { day: 26, amount: 1600,  type: 'expense', category: 'Dining',        note: 'Friends meetup' },
    { day: 28, amount: 2100,  type: 'expense', category: 'Groceries',     note: 'End-of-month top-up' },
  ];

  for (const s of samples) {
    const day = Math.min(s.day, lastDay);
    const date = new Date(year, month, day, 10, 0, 0, 0);
    await prisma.financialRecord.create({
      data: {
        amount: s.amount,
        type: s.type,
        category: s.category,
        date,
        note: encrypt(s.note),
        userId: admin.id,
      },
    });
  }

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: {
        userId: admin.id,
        is_deleted: false,
        type: 'income',
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.financialRecord.aggregate({
      where: {
        userId: admin.id,
        is_deleted: false,
        type: 'expense',
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  console.log(`Inserted ${samples.length} records.`);
  console.log(`  Income  : ${incomeAgg._sum.amount?.toString() ?? '0'}`);
  console.log(`  Expense : ${expenseAgg._sum.amount?.toString() ?? '0'}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
