const ELLG_ID = "4484765"; // ellg
const LCOLONQ_ID = "866686220"; // lcolonq

export const twitchOauthScopes = [
  "moderator:manage:announcements",
  "moderator:read:banned_users",
  "moderator:manage:banned_users",
  "moderator:read:chat_messages",
  "moderator:manage:chat_messages",
  "moderator:read:chatters",
  "moderator:read:followers",
  "moderator:read:shoutouts",
  "moderator:read:vips",
  "user:bot",
  "user:read:chat",
  "user:write:chat",
  "chat:edit",
  "chat:read",
];

export async function getAppToken(clientId: string, clientSecret: string) {
  const url = "https://id.twitch.tv/oauth2/token";

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const request = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!request.ok) {
    const error = await request.text();
    console.error(error);
    throw new Error("Failed to get app token");
  }

  return request.json() as Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

export async function getUserToken(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
) {
  const url = "https://id.twitch.tv/oauth2/token";

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const request = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!request.ok) {
    const error = await request.text();
    console.error(error);
    throw new Error("Failed to get user token");
  }

  return request.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string[];
    token_type: string;
  }>;
}

export async function refreshUserToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
) {
  const url = "https://id.twitch.tv/oauth2/token";

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const request = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!request.ok) {
    const error = await request.text();
    console.error(error);
    throw new Error("Failed to refresh user token");
  }

  return request.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string[];
    token_type: string;
  }>;
}

export type EventSubscription<T = {}> = {
  type: string;
  version: string;
  condition: T;
};

export async function createSubscription(
  clientId: string,
  accessToken: string,
  secret: string,
  condition: EventSubscription
) {
  const transport = {
    method: "webhook",
    callback: "https://computer.ell.dev/twitch/eventsub",
    secret,
  };

  const payload = {
    type: condition.type,
    version: condition.version,
    condition: condition.condition,
    transport,
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Client-Id": clientId,
    "Content-Type": "application/json",
  };

  const url = "https://api.twitch.tv/helix/eventsub/subscriptions";

  const request = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!request.ok) {
    const error = await request.text();
    console.error(error);
    throw new Error("Failed to create subscription");
  }

  return request.json() as Promise<{
    data: {
      id: string;
      status: string;
      type: string;
      version: string;
      condition: any;
      created_at: string;
      transport: {
        method: string;
        callback: string;
      };
    }[];
  }>;
}

export async function deleteSubscription(
  clientId: string,
  accessToken: string,
  subscriptionId: string
) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Client-Id": clientId,
  };

  const url = `https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`;

  const request = await fetch(url, {
    method: "DELETE",
    headers,
  });

  if (!request.ok) {
    const error = await request.text();
    console.error(error);
    throw new Error("Failed to delete subscription");
  }
}

export async function getTwitchTeamMembers(
  clientId: string,
  appToken: string,
  teamName: string
) {
  const url = `https://api.twitch.tv/helix/teams?name=${teamName}`;

  const headers = {
    Authorization: `Bearer ${appToken}`,
    "Client-Id": clientId,
  };

  const request = await fetch(url, {
    headers,
  });

  if (!request.ok) {
    const error = await request.text();
    console.error(error);
    throw new Error("Failed to get twitch team members");
  }

  return request.json() as Promise<{
    data: {
      id: string;
      users: {
        user_id: string;
        user_login: string;
        user_name: string;
      }[];
    }[];
  }>;
}
