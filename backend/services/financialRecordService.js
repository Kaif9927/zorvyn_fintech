const { prisma } = require('../db');
const { AppError } = require('../lib/errors');
const { Prisma } = require('@prisma/client');
const { encrypt, mapRecordNotesOut } = require('../lib/cryptoAtRest');

const baseWhere = { is_deleted: false };

function buildFilterQuery(query, userId, role) {
  const {
    dateFrom,
    dateTo,
    category,
    type,
    search,
    page = 1,
    limit = 10,
  } = query;

  const where = {
    ...baseWhere,
    ...(role !== 'Admin' ? { userId } : {}),
  };

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.date.lte = end;
    }
  }

  if (category) {
    where.category = { contains: category };
  }

  if (type && (type === 'income' || type === 'expense')) {
    where.type = type;
  }

  // Notes are encrypted at rest — substring search applies to category only.
  if (search) {
    where.AND = where.AND || [];
    where.AND.push({
      category: { contains: search },
    });
  }

  return { where, page: Number(page), limit: Math.min(Number(limit) || 10, 100) };
}

async function listRecords(query, userId, role) {
  const { where, page, limit } = buildFilterQuery(query, userId, role);
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  const items = rows.map((r) => ({
    ...mapRecordNotesOut(r),
    user: r.user,
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getRecordById(id, userId, role) {
  const where = {
    id: Number(id),
    ...baseWhere,
    ...(role !== 'Admin' ? { userId } : {}),
  };
  const record = await prisma.financialRecord.findFirst({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!record) {
    throw new AppError('Record not found', 404);
  }
  return { ...mapRecordNotesOut(record), user: record.user };
}

async function createRecord(data, userId) {
  const noteStored = data.note ? encrypt(data.note) : null;
  const created = await prisma.financialRecord.create({
    data: {
      amount: new Prisma.Decimal(data.amount),
      type: data.type,
      category: data.category,
      date: new Date(data.date),
      note: noteStored,
      userId,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return { ...mapRecordNotesOut(created), user: created.user };
}

async function updateRecord(id, data, userId, role) {
  await getRecordById(id, userId, role);

  const updateData = {};
  if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);
  if (data.type !== undefined) updateData.type = data.type;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.note !== undefined) {
    updateData.note = data.note ? encrypt(data.note) : null;
  }

  const updated = await prisma.financialRecord.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return { ...mapRecordNotesOut(updated), user: updated.user };
}

async function softDeleteRecord(id, userId, role) {
  await getRecordById(id, userId, role);
  return prisma.financialRecord.update({
    where: { id: Number(id) },
    data: { is_deleted: true },
  });
}

module.exports = {
  listRecords,
  getRecordById,
  createRecord,
  updateRecord,
  softDeleteRecord,
};
