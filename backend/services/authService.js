const { prisma } = require('../db');
const { hashPassword, comparePassword } = require('../lib/password');
const { signToken } = require('../lib/jwt');
const { AppError } = require('../lib/errors');

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }
  const ok = await comparePassword(password, user.password);
  if (!ok) {
    throw new AppError('Invalid email or password', 401);
  }
  if (user.status !== 'active') {
    throw new AppError('Account is inactive', 403);
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
}

async function registerUser(data, actorRole) {
  // Only Admin can create users via API (seed handles first admin)
  if (actorRole && actorRole !== 'Admin') {
    throw new AppError('Only administrators can create users', 403);
  }

  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email is already registered', 400);
  }

  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      password: hashed,
      role: data.role || 'Viewer',
      status: data.status || 'active',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
  return user;
}

/** Public self-registration — always creates a Viewer account. */
async function signupPublic({ name, email, password }) {
  const emailNorm = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) {
    throw new AppError('Email is already registered', 400);
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: emailNorm,
      password: hashed,
      role: 'Viewer',
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
  return user;
}

module.exports = { login, registerUser, signupPublic };
