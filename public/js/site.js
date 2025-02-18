const VAPID_PUBLIC_KEY =
  "BG9KvUazhqvGnoz2yifUiKk82c_TSUOVY2bVyg1Hg-JlgcbrTlhFSGFVh66qQ4EeWdtNHHLLnHUSIW2conBi6OI";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register("/worker.js");

    console.log("Service Worker registered with scope:", registration.scope);

    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
  }
}

function askPermission() {
  return new Promise(function (resolve, reject) {
    const permissionResult = Notification.requestPermission(function (result) {
      resolve(result);
    });

    if (permissionResult) {
      permissionResult.then(resolve, reject);
    }
  }).then(function (permissionResult) {
    if (permissionResult !== "granted") {
      throw new Error("We weren't granted permission.");
    }
  });
}

async function subscribeUserToPush() {
  const registration = await navigator.serviceWorker.register("/worker.js");

  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  };

  const pushSubscription = await registration.pushManager.subscribe(
    subscribeOptions
  );

  console.log("Received PushSubscription: ", JSON.stringify(pushSubscription));

  return pushSubscription;
}

async function onSubscribeClicked() {
  await registerServiceWorker();

  askPermission();

  const subscription = await subscribeUserToPush();

  await fetch("/notifications/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscription }),
  });
}
