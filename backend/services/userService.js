const { prisma } = require('../db');
const { hashPassword } = require('../lib/password');
const { AppError } = require('../lib/errors');

async function listUsers({ page = 1, limit = 10, search = '' }) {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Math.min(Number(limit) || 10, 100);

  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take) || 1,
    },
  };
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
}

async function updateUser(id, data) {
  await getUserById(id);

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  return prisma.user.update({
    where: { id: Number(id) },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
}

async function deleteUser(id) {
  await getUserById(id);
  await prisma.user.delete({ where: { id: Number(id) } });
}

module.exports = { listUsers, getUserById, updateUser, deleteUser };
