import { Context } from "hono";
import {
  deleteCookie,
  getCookie,
  getSignedCookie,
  setSignedCookie,
} from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { generateId } from "../crypto";
import { CookieOptions } from "hono/utils/cookie";

declare module "hono" {
  interface ContextVariableMap {
    session: Session;
  }
}

export interface SessionData {
  createdAt: string;
  challenge: string;
  user?: {
    username: string;
    access_token: string;
  };
}

export interface Session {
  id: string;
  data: SessionData;
}

export const useSession = createMiddleware<{
  Bindings: Bindings;
  Variables: {
    session?: Session;
  };
}>(async (c, next) => {
  const kv = c.env.KV;
  const secret = c.env.COOKIE_SECRET;

  const domain = c.req.url
    .split("/")
    .slice(0, 3)
    .join("/")
    .replace(/^https?:\/\//, "")
    .replace(/:\d+$/, "");

  const expiration = new Date(Date.now() + 1000 * 3600);

  const cookie: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    expires: expiration,
    maxAge: 3600,
  };

  if (!domain.includes("localhost")) {
    cookie.domain = domain;
  }

  const sessionId = await getSignedCookie(c, secret, "session_id");

  let session: Session;

  if (!sessionId) {
    const newSessionId = crypto.randomUUID();
    const sessionData: SessionData = {
      createdAt: new Date().toISOString(),
      challenge: generateId(45),
    };

    await kv.put(newSessionId, JSON.stringify(sessionData));

    await setSignedCookie(c, "session_id", newSessionId, secret, cookie);

    session = { id: newSessionId, data: sessionData };
  } else {
    const sessionData = await kv.get(sessionId);

    if (sessionData) {
      session = {
        id: sessionId,
        data: JSON.parse(sessionData) as SessionData,
      };
    } else {
      const newSessionId = crypto.randomUUID();
      const sessionData: SessionData = {
        createdAt: new Date().toISOString(),
        challenge: generateId(45),
      };

      await kv.put(newSessionId, JSON.stringify(sessionData));

      await setSignedCookie(c, "session_id", newSessionId, secret, cookie);

      session = { id: newSessionId, data: sessionData };
    }
  }

  c.set("session", session);

  await next();

  const updatedSession = c.get("session");
  if (updatedSession) {
    await kv.put(updatedSession.id, JSON.stringify(updatedSession.data));
  }
});

export const logout = async (c: Context) => {
  const kv = c.env.KV;
  const sessionId = getCookie(c, "session_id");

  if (!sessionId) return;

  await kv.delete(sessionId);

  deleteCookie(c, "session_id", {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
};

export const login = async (
  c: Context,
  username: string,
  access_token: string
) => {
  const kv = c.env.KV;
  const secret = c.env.COOKIE_SECRET;
  const sessionId = await getSignedCookie(c, secret, "session_id");

  if (!sessionId) return;

  const sessionData = await kv.get(sessionId);

  if (sessionData) {
    const session: Session = {
      id: sessionId,
      data: JSON.parse(sessionData) as SessionData,
    };

    session.data.user = { username, access_token };

    await kv.put(session.id, JSON.stringify(session.data));

    c.set("session", session);
  }
};
