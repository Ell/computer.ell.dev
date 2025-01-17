import { Hono } from "hono";
import { HtmlEscapedString } from "hono/utils/html";

import { extract, install } from "@twind/core";
import presetTailwind from "@twind/preset-tailwind";

import { IndexPage } from "./pages";
import { login, logout, useSession } from "./middleware/session";
import { doPushedAuthorizationRequest, doTokenRequest } from "./oauth";
import {
  doAPIInfoRequest,
  doAPIStatusRequest,
  doGamer,
  doHex,
  doSuperIdol,
} from "./clonk";

install({
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          "50": "#ecfdf5",
          "100": "#d1fae5",
          "200": "#a7f3d0",
          "300": "#6ee7b7",
          "400": "#34d399",
          "500": "#10b981",
          "600": "#059669",
          "700": "#047857",
          "800": "#065f46",
          "900": "#064e3b",
          "950": "#022c22",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
    },
  },
  presets: [presetTailwind()],
});

async function withTwind(body: HtmlEscapedString | Promise<HtmlEscapedString>) {
  const { html, css } = extract((await body).toString());

  return html.replace("</head>", `<style data-twind>${css}</style></head>`);
}

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", useSession);

app.get("/", async (c) => {
  const session = c.get("session");

  return c.html(await withTwind(<IndexPage session={session} />));
});

app.get("/login", async (c) => {
  const session = c.get("session");

  const clientId = c.env.CLIENT_ID;
  const redirectUri = c.env.REDIRECT_URI;
  const state = crypto.randomUUID().slice(0, 8);
  const challenge = session.data.challenge;

  const requestUri = await doPushedAuthorizationRequest(
    clientId,
    redirectUri,
    state,
    challenge
  );

  const url = `https://auth.colonq.computer/api/oidc/authorization?client_id=${clientId}&request_uri=${requestUri}`;

  return c.redirect(url);
});

app.get("/logout", async (c) => {
  await logout(c);

  return c.redirect("/");
});

app.get("/auth/redirect", async (c) => {
  const session = c.get("session");

  const code = c.req.query("code");

  if (!code) {
    return c.redirect("/");
  }

  const clientId = c.env.CLIENT_ID;
  const redirectUri = c.env.REDIRECT_URI;
  const challenge = session.data.challenge;

  const tokenResponse = await doTokenRequest(
    clientId,
    redirectUri,
    code,
    challenge
  );

  const info = await doAPIInfoRequest(tokenResponse.access_token);

  const [username] = info.split(" ");

  await login(c, username, tokenResponse.access_token);

  return c.redirect("/");
});

app.get("/gamer", async (c) => {
  const session = c.get("session");

  if (!session.data.user) {
    return c.redirect("/");
  }

  await doGamer(session.data.user.access_token);
  await doSuperIdol(session.data.user.access_token);
  await doHex(
    session.data.user.access_token,
    "maniac",
    session.data.user.username
  );

  return c.redirect("/");
});

export default app;
