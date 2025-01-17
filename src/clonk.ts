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
  const response = await doRedeem(authToken, "gamer");
  console.log("gamer response", response);
}

export async function doSuperIdol(authToken: string) {
  const response = await doRedeem(authToken, "super idol");
  console.log("super idol response", response);
}

export async function doHex(authToken: string, hex: string, target: string) {
  const input = `${hex} ${target}`;
  const response = await doRedeem(authToken, "hex", input);
  console.log("hex input", input);
  console.log("hex response", response);
}
