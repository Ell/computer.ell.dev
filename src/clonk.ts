import { hashCodeChallenge } from "./crypto";

export async function doAPIStatusRequest(authToken: string) {
  const url = "https://secure.colonq.computer/api/status";

  const headers = {
    "Proxy-Authorization": `Bearer ${authToken}`,
  };

  const request = await fetch(url, { headers });

  if (!request.ok) {
    const error = await request.text();
    console.error(error);
    throw new Error("Failed to do status request");
  }

  return request.text();
}

export async function doAPIInfoRequest(authToken: string) {
  const url = "https://secure.colonq.computer/api/info";

  const headers = {
    "Proxy-Authorization": `Bearer ${authToken}`,
  };

  const request = await fetch(url, { headers });

  if (!request.ok) {
    const error = await request.text();
    console.error(error);
    throw new Error("Failed to do info request");
  }

  return request.text();
}

async function doRedeem(authToken: string, name: string, input?: string) {
  const url = "https://secure.colonq.computer/api/redeem";

  const headers = {
    "Proxy-Authorization": `Bearer ${authToken}`,
  };

  const formData = new FormData();
  formData.append("name", name);
  formData.append("input", input ? input : "");

  const request = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!request.ok) {
    const error = await request.text();
    console.error(error);
    throw new Error("Failed to redeem");
  }

  return request.text();
}

export async function doGamer(authToken: string) {
  await doRedeem(authToken, "gamer");
}

export async function doSuperIdol(authToken: string) {
  await doRedeem(authToken, "super idol");
}

export async function doHex(authToken: string, hex: string, target: string) {
  const input = `${hex.toUpperCase()} ${target}`;
  await doRedeem(authToken, "hex", input);
}

export async function doPushedAuthorizationRequest(
  clientId: string,
  redirectUri: string,
  state: string,
  codeChallenge: string
): Promise<string> {
  const formData = new FormData();

  const hashedCodeChallenge = await hashCodeChallenge(codeChallenge);

  formData.append("response_type", "code");
  formData.append("client_id", clientId);
  formData.append("redirect_uri", redirectUri);
  formData.append("scope", "authelia.bearer.authz");
  formData.append("audience", "https://secure.colonq.computer");
  formData.append("state", state);
  formData.append("code_challenge_method", "S256");
  formData.append("code_challenge", hashedCodeChallenge);

  const response = await fetch(
    "https://auth.colonq.computer/api/oidc/pushed-authorization-request",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to do authorization request");
  }

  const data = (await response.json()) as { request_uri: string };

  return data.request_uri;
}

export async function doTokenRequest(
  clientId: string,
  redirectUri: string,
  code: string,
  challenge: string
): Promise<{
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}> {
  const formData = new FormData();

  formData.append("client_id", clientId);
  formData.append("redirect_uri", redirectUri);
  formData.append("grant_type", "authorization_code");
  formData.append("code", code);
  formData.append("code_verifier", challenge);

  const response = await fetch("https://auth.colonq.computer/api/oidc/token", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(error);

    throw new Error("Failed to do token request");
  }

  return response.json();
}
