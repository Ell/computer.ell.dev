export function dec2hex(dec: number) {
  return dec.toString(16).padStart(2, "0");
}

export function generateId(len: number) {
  var arr = new Uint8Array((len || 40) / 2);
  crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join("");
}

export async function hashCodeChallenge(
  codeChallenge: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeChallenge);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const base64String = btoa(String.fromCharCode(...hashArray));
  return base64String
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function buildHmacMessage(
  request: Request,
  messageId: string,
  messageTimestamp: string
): Promise<string> {
  const body = await request.text();

  return messageId + messageTimestamp + body;
}

export async function getHmac(
  secret: string,
  message: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message)
  );

  const hashArray = Array.from(new Uint8Array(signature));

  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function verifyMessage(hmac: string, verifySignature: string) {
  const encoder = new TextEncoder();

  return crypto.subtle.timingSafeEqual(
    encoder.encode(hmac),
    encoder.encode(verifySignature)
  );
}
