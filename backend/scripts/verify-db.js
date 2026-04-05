/* Quick check that DATABASE_URL works */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { prisma } = require('../db')

async function main() {
  await prisma.$connect()
  const userCount = await prisma.user.count()
  const recordCount = await prisma.financialRecord.count({ where: { is_deleted: false } })
  console.log('Connected to MySQL.')
  console.log(`  users: ${userCount}, financial_records (active): ${recordCount}`)
}

main()
  .catch((e) => {
    console.error('Connection failed:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
