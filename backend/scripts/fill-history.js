/* eslint-disable no-console */
/**
 * Backfill financial records for the last `MONTHS_BACK` calendar months,
 * up to (and including) today, for the seeded admin user.
 *
 * - Each historical month gets a balanced set of income + expense rows.
 * - For the current month, only rows on or before today's date are inserted.
 * - A month is skipped if it already has at least MIN_PER_MONTH records,
 *   so the script is safe to re-run.
 *
 * Usage: node scripts/fill-history.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { prisma } = require('../db');
const { encrypt } = require('../lib/cryptoAtRest');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'mohdkaifa909@gmail.com')
  .toLowerCase()
  .trim();

const MONTHS_BACK = 6;
const MIN_PER_MONTH = 8;

/** Deterministic per-month sample rows (day-of-month + category + type + base amount). */
const PATTERN = [
  { day: 1,  type: 'income',  category: 'Salary',        base: 65000, jitter: 0.04 },
  { day: 2,  type: 'expense', category: 'Rent',          base: 18000, jitter: 0.00 },
  { day: 4,  type: 'expense', category: 'Groceries',     base: 2500,  jitter: 0.20 },
  { day: 6,  type: 'expense', category: 'Transport',     base: 850,   jitter: 0.30 },
  { day: 8,  type: 'expense', category: 'Dining',        base: 1200,  jitter: 0.40 },
  { day: 11, type: 'income',  category: 'Freelance',     base: 9000,  jitter: 0.50 },
  { day: 13, type: 'expense', category: 'Coffee',        base: 450,   jitter: 0.30 },
  { day: 15, type: 'expense', category: 'Subscriptions', base: 1500,  jitter: 0.05 },
  { day: 17, type: 'expense', category: 'Groceries',     base: 2200,  jitter: 0.25 },
  { day: 19, type: 'expense', category: 'Shopping',      base: 3500,  jitter: 0.60 },
  { day: 22, type: 'income',  category: 'Investments',   base: 4500,  jitter: 0.30 },
  { day: 24, type: 'expense', category: 'Health',        base: 950,   jitter: 0.40 },
  { day: 26, type: 'expense', category: 'Transport',     base: 700,   jitter: 0.40 },
  { day: 28, type: 'expense', category: 'Dining',        base: 1600,  jitter: 0.45 },
];

function pseudoRandom(seed) {
  let x = seed | 0;
  return () => {
    x = (x * 1664525 + 1013904223) | 0;
    return ((x >>> 0) % 10000) / 10000;
  };
}

function jitterAmount(base, factor, rng) {
  const delta = (rng() * 2 - 1) * factor;
  return Math.max(1, Math.round(base * (1 + delta)));
}

async function fillMonth(adminId, year, monthIdx, todayCutoff) {
  const monthStart = new Date(year, monthIdx, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
  const lastDay = monthEnd.getDate();
  const cutoffDay = todayCutoff && monthEnd > todayCutoff ? todayCutoff.getDate() : lastDay;

  const existing = await prisma.financialRecord.count({
    where: {
      userId: adminId,
      is_deleted: false,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  if (existing >= MIN_PER_MONTH) {
    return { year, monthIdx, inserted: 0, existing, skipped: true };
  }

  const rng = pseudoRandom(year * 100 + monthIdx);
  let inserted = 0;

  for (const p of PATTERN) {
    if (p.day > cutoffDay) continue;
    const date = new Date(year, monthIdx, p.day, 10, 0, 0, 0);
    const amount = jitterAmount(p.base, p.jitter, rng);
    await prisma.financialRecord.create({
      data: {
        amount,
        type: p.type,
        category: p.category,
        date,
        note: encrypt(`${p.category} ${date.toISOString().slice(0, 10)}`),
        userId: adminId,
      },
    });
    inserted += 1;
  }

  return { year, monthIdx, inserted, existing, skipped: false };
}

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    throw new Error(`Admin user '${ADMIN_EMAIL}' not found. Run the seed first.`);
  }

  const today = new Date();
  console.log(
    `Backfilling ${MONTHS_BACK} months ending ${today.toISOString().slice(0, 10)} for ${admin.email}`
  );

  const results = [];
  for (let offset = MONTHS_BACK - 1; offset >= 0; offset--) {
    const d = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const r = await fillMonth(admin.id, d.getFullYear(), d.getMonth(), today);
    results.push(r);
    const label = `${r.year}-${String(r.monthIdx + 1).padStart(2, '0')}`;
    if (r.skipped) {
      console.log(`  ${label}: skipped (already has ${r.existing} records)`);
    } else {
      console.log(`  ${label}: inserted ${r.inserted} (existing ${r.existing})`);
    }
  }

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { userId: admin.id, is_deleted: false, type: 'income' },
      _sum: { amount: true },
    }),
    prisma.financialRecord.aggregate({
      where: { userId: admin.id, is_deleted: false, type: 'expense' },
      _sum: { amount: true },
    }),
  ]);

  console.log('--');
  console.log(
    `Totals (admin): income ${incomeAgg._sum.amount?.toString() ?? '0'}, expense ${expenseAgg._sum.amount?.toString() ?? '0'}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
