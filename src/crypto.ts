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
