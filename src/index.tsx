import { Hono } from "hono";
import { HtmlEscapedString } from "hono/utils/html";

import { extract, install } from "@twind/core";
import presetTailwind from "@twind/preset-tailwind";

import { login, logout, useSession } from "./middleware/session";
import {
  doAPIInfoRequest,
  doGamer,
  doHex,
  doSuperIdol,
  doPushedAuthorizationRequest,
  doTokenRequest,
} from "./clonk";
import { IndexPage } from "./pages";
import { AdminPage } from "./pages/admin";
import {
  createSubscription,
  deleteSubscription,
  getAppToken,
  getTwitchStream,
  getTwitchTeamMembers,
  getTwitchUser,
  getUserToken,
  refreshUserToken,
  twitchOauthScopes,
} from "./twitch";
import { buildHmacMessage, getHmac, verifyMessage } from "./crypto";
import { chunk } from "./collections";
import { buildPushPayload } from "@block65/webcrypto-web-push";

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

app.post("/notifications/register", async (c) => {
  const session = c.get("session");

  if (!session.data.user) {
    return c.json({ error: "Not logged in" }, 401);
  }

  const payload = await c.req.json<{
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  }>();

  if (!payload.subscription) {
    return c.json({ error: "Invalid payload" }, 400);
  }

  if (
    !payload.subscription.endpoint ||
    !payload.subscription.keys.p256dh ||
    !payload.subscription.keys.auth
  ) {
    return c.json({ error: "Invalid subscription data" }, 400);
  }

  // store in kv with sub prefix
  await c.env.KV.put(
    `notification:${payload.subscription.endpoint}`,
    JSON.stringify(payload.subscription)
  );

  return c.body(null, 204);
});

app.get("/admin", async (c) => {
  const session = c.get("session");

  if (!session.data.user || session.data.user.username !== "ellg") {
    return c.redirect("/");
  }

  const appToken = await c.env.KV.get("twitch_app_token");
  const userToken = await c.env.KV.get("twitch_user_token");
  const userRefreshToken = await c.env.KV.get("twitch_user_refresh_token");

  const twitchData = {
    appToken: appToken ? "Set" : "Not Set",
    userToken: userToken ? "Set" : "Not Set",
    userRefreshToken: userRefreshToken ? "Set" : "Not Set",
  };

  return c.html(
    await withTwind(<AdminPage session={session} twitch={twitchData} />)
  );
});

app.get("/admin/twitch/refresh", async (c) => {
  const session = c.get("session");

  if (!session.data.user || session.data.user.username !== "ellg") {
    return c.redirect("/");
  }

  const clientId = c.env.TWITCH_CLIENT_ID;
  const clientSecret = c.env.TWITCH_CLIENT_SECRET;

  const appToken = await getAppToken(clientId, clientSecret);

  await c.env.KV.put("twitch_app_token", appToken.access_token);

  const scope = twitchOauthScopes.join(" ");

  const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${c.env.TWITCH_REDIRECT_URI}&response_type=code&scope=${scope}`;

  return c.redirect(twitchAuthUrl);
});

app.post("/admin/twitch/team/refresh", async (c) => {
  const session = c.get("session");

  if (!session.data.user || session.data.user.username !== "ellg") {
    return c.redirect("/");
  }

  const clientId = c.env.TWITCH_CLIENT_ID;
  const accessToken = await c.env.KV.get("twitch_app_token");

  if (!accessToken) {
    console.error("No Twitch App Token Set");
    return c.redirect("/admin");
  }

  await c.env.KV.put("twitch_team_members", JSON.stringify([]));

  await updateTeamMembers(c.env, clientId, accessToken);

  return c.redirect("/admin");
});

app.get("/twitch/auth/redirect", async (c) => {
  const query = c.req.query();

  if (query.error) {
    console.error({ error: query.error, description: query.error_description });
    return c.redirect("/admin");
  }

  const code = query.code;

  const userToken = await getUserToken(
    c.env.TWITCH_CLIENT_ID,
    c.env.TWITCH_CLIENT_SECRET,
    code,
    c.env.TWITCH_REDIRECT_URI
  );

  await c.env.KV.put("twitch_user_token", userToken.access_token);
  await c.env.KV.put("twitch_user_refresh_token", userToken.refresh_token);

  return c.redirect("/admin");
});

app.post("/twitch/eventsub", async (c) => {
  // Notification request headers
  const TWITCH_MESSAGE_ID = "Twitch-Eventsub-Message-Id".toLowerCase();
  const TWITCH_MESSAGE_TIMESTAMP =
    "Twitch-Eventsub-Message-Timestamp".toLowerCase();
  const TWITCH_MESSAGE_SIGNATURE =
    "Twitch-Eventsub-Message-Signature".toLowerCase();
  const MESSAGE_TYPE = "Twitch-Eventsub-Message-Type".toLowerCase();

  // Notification message types
  const MESSAGE_TYPE_VERIFICATION = "webhook_callback_verification";
  const MESSAGE_TYPE_NOTIFICATION = "notification";
  const MESSAGE_TYPE_REVOCATION = "revocation";

  const twitchMessageSignature = c.req.header(TWITCH_MESSAGE_SIGNATURE);

  if (!twitchMessageSignature) {
    console.error("No Twitch Message Signature");
    return c.text("No Twitch Message Signature", 400);
  }

  const messageId = c.req.header(TWITCH_MESSAGE_ID) ?? "";
  const messageTimestamp = c.req.header(TWITCH_MESSAGE_TIMESTAMP) ?? "";

  const message = await buildHmacMessage(
    c.req.raw.clone(),
    messageId,
    messageTimestamp
  );

  const hmac = await getHmac(c.env.TWITCH_CLIENT_SECRET, message);
  const twitchMac = twitchMessageSignature.replace("sha256=", "");

  if (!verifyMessage(hmac, twitchMac)) {
    console.error("Invalid Twitch Message Signature");
    return c.text("Invalid Twitch Message Signature", 403);
  }

  switch (c.req.header(MESSAGE_TYPE)) {
    case MESSAGE_TYPE_VERIFICATION:
      console.log("Verification Request Received");
      const challenge = await c.req.json();
      return c.text(challenge.challenge);
    case MESSAGE_TYPE_NOTIFICATION:
      const notification = await c.req.json();
      console.log("got notification", notification);

      if (notification.subscription.type === "stream.online") {
        console.log("handling live notification");
        await handleOnlineNotification(
          c.env,
          notification.event.broadcaster_user_id
        );
      }

      return c.body(null, 204);
    case MESSAGE_TYPE_REVOCATION:
      return c.body(null, 204);
    default:
      return c.text("Unknown Message Type", 400);
  }
});

async function handleOnlineNotification(env: Bindings, userId: string) {
  const appToken = await env.KV.get("twitch_app_token");
  if (!appToken) {
    console.error("No Twitch App Token Set");
    return;
  }

  const twitchUser = await getTwitchStream(
    env.TWITCH_CLIENT_ID,
    appToken,
    userId
  );

  const username = twitchUser.data[0].user_login;
  const displayName = twitchUser.data[0].user_name;
  const title = twitchUser.data[0].title;
  const thumbnail = twitchUser.data[0].thumbnail_url;

  let keys: KVNamespaceListKey<unknown, string>[] = [];
  let cursor: string | undefined = undefined;
  let isComplete = false;

  console.log("fetching notification keys");

  while (!isComplete) {
    const notificationKeys: any = await env.KV.list({
      prefix: "notification:",
      cursor,
    });

    keys = [...keys, ...notificationKeys.keys];

    cursor = notificationKeys.cursor;
    isComplete = notificationKeys.list_complete;
  }

  console.log("got keys", keys);

  const chunkedKeys = chunk(keys, 5);

  for (const chunk of chunkedKeys) {
    const notifications = await Promise.all(
      chunk.map((key) => env.KV.get(key.name))
    );

    const payloadData = {
      data: {
        username,
        displayName,
        title,
        thumbnail,
      },
      options: {
        topic: "team-green-notification",
        urgency: "high" as const,
      },
    };

    const requests = notifications.map(async (notification, index) => {
      if (!notification) {
        return;
      }

      const subscription = JSON.parse(notification);

      const payload = await buildPushPayload(payloadData, subscription, {
        subject: "https://computer.ell.dev/",
        publicKey: env.VAPID_PUBLIC_KEY,
        privateKey: env.VAPID_PRIVATE_KEY,
      });

      console.log("sending notification payload", payload);

      return fetch(subscription.endpoint, payload);
    });

    await Promise.all(requests);
  }
}

async function updateTeamMembers(
  env: Bindings,
  clientId: string,
  accessToken: string
) {
  // https://twitch.tv/teams/green
  const teamName = "green";

  // Pull current team members from Twitch
  const updatedMembers = (
    await getTwitchTeamMembers(clientId, accessToken, teamName)
  ).data[0].users.map((user) => user.user_id);

  console.log("Updated Members", updatedMembers);

  // Pull current team members from KV
  const currentMembers = JSON.parse(
    (await env.KV.get("twitch_team_members")) || "[]"
  ) as string[];

  // Pull current list of subscriptions from KV
  const subscriptions = JSON.parse(
    (await env.KV.get("twitch_subscriptions")) || "{}"
  ) as { [key: string]: { online: string; offline: string } };

  // Find all removed members since last update
  const removedMembers = currentMembers.filter(
    (member) => !updatedMembers.includes(member)
  );

  // Find all newly added members since last update
  const newMembers = updatedMembers.filter(
    (member: string) => !currentMembers.includes(member)
  );

  // Delete eventsub subscriptions for all removed members
  const deleteRequests = removedMembers
    .filter((member) => member in subscriptions)
    .flatMap((member) => {
      const subscription = subscriptions[member];

      return [
        deleteSubscription(clientId, accessToken, subscription.online),
        deleteSubscription(clientId, accessToken, subscription.offline),
      ];
    });

  const subscribeRequests = newMembers.flatMap((member) => {
    const onlineSubscription = createSubscription(
      clientId,
      accessToken,
      env.TWITCH_CLIENT_SECRET,
      {
        type: "stream.online",
        version: "1",
        condition: {
          broadcaster_user_id: member,
        },
      }
    );

    const offlineSubscription = createSubscription(
      clientId,
      accessToken,
      env.TWITCH_CLIENT_SECRET,
      {
        type: "stream.offline",
        version: "1",
        condition: {
          broadcaster_user_id: member,
        },
      }
    );

    return [onlineSubscription, offlineSubscription];
  });

  const requests = chunk([...deleteRequests, ...subscribeRequests], 5);
  for (const request of requests) {
    const result = await Promise.allSettled(request);

    result.forEach((r) => {
      if (r.status === "fulfilled" && typeof r.value === "object") {
        const subscription = r.value.data[0];
        const member = subscription.condition.broadcaster_user_id;

        if (subscription.type === "stream.online") {
          subscriptions[member] = {
            ...subscriptions[member],
            online: subscription.id,
          };
        } else if (subscription.type === "stream.offline") {
          subscriptions[member] = {
            ...subscriptions[member],
            offline: subscription.id,
          };
        }
      }
    });
  }

  // Update KV with new team members and subscriptions
  await env.KV.put("twitch_team_members", JSON.stringify(updatedMembers));
  await env.KV.put("twitch_subscriptions", JSON.stringify(subscriptions));
}

export default {
  scheduled: async (
    controller: ScheduledController,
    env: Bindings,
    ctx: ExecutionContext
  ) => {
    switch (controller.cron) {
      // Every Hour
      case "0 * * * *": {
        const accessToken = await env.KV.get("twitch_app_token");
        if (!accessToken) {
          console.error("No Twitch App Token Set");
          return;
        }

        const clientId = env.TWITCH_CLIENT_ID;

        await updateTeamMembers(env, clientId, accessToken);

        break;
      }
      case "*/30 * * * *": {
        console.log("Refreshing Twitch User Token");

        const refreshToken = await env.KV.get("twitch_user_refresh_token");
        if (!refreshToken) {
          console.error("No Twitch User Refresh Token Set");
          return;
        }

        const clientSecret = env.TWITCH_CLIENT_SECRET;
        const clientId = env.TWITCH_CLIENT_ID;

        const refreshResponse = await refreshUserToken(
          clientId,
          clientSecret,
          refreshToken
        );

        await env.KV.put("twitch_user_token", refreshResponse.access_token);
        await env.KV.put(
          "twitch_user_refresh_token",
          refreshResponse.refresh_token
        );

        break;
      }
      default: {
        break;
      }
    }
  },
  fetch: (request: Request, env: Bindings, ctx: ExecutionContext) => {
    return app.fetch(request, env, ctx);
  },
};
