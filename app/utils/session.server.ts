import { db } from './db.server';
import { compare, hash } from 'bcryptjs';
import { createCookieSessionStorage, redirect } from '@remix-run/node';

type LoginForm = {
  username: string;
  password: string;
};

export const login = async ({ username, password }: LoginForm) => {
  const user = await db.user.findUnique({
    where: { username },
  });
  if (!user) return null;

  const isCorrectPassword = await compare(password, user.passwordHash);
  if (!isCorrectPassword) return null;

  return { id: user.id, username };
};

export const register = async ({ username, password }: LoginForm) => {
  const passwordHash = await hash(password, 10);
  const user = await db.user.create({
    data: { username, passwordHash },
  });
  return { id: user.id, username };
};

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set');
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'RJ_session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export const createUserSession = async (userId: string, redirectTo: string) => {
  const session = await storage.getSession();
  session.set('userId', userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  });
};

const getUserSession = (request: Request) => {
  return storage.getSession(request.headers.get('Cookie'));
};

export const getUserId = async (request: Request) => {
  const userSession = await getUserSession(request);
  const userId = userSession.get('userId');
  if (!userId || typeof userId !== 'string') return null;
  return userId;
};

export const requireUserId = async (
  request: Request,
  redirectTo: string = new URL(request.url).pathname,
) => {
  const userSession = await getUserSession(request);
  const userId = userSession.get('userId');
  if (!userId || typeof userId !== 'string') {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
};

export const logout = async (request: Request) => {
  const userSession = await getUserSession(request);
  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(userSession),
    },
  });
};

export const getUser = async (request: Request) => {
  const userId = await getUserId(request);
  if (typeof userId !== 'string') {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });
    return user;
  } catch {
    throw logout(request);
  }
};
