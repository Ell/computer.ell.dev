const VAPID_PUBLIC_KEY =
  "BG9KvUazhqvGnoz2yifUiKk82c_TSUOVY2bVyg1Hg-JlgcbrTlhFSGFVh66qQ4EeWdtNHHLLnHUSIW2conBi6OI";

self.addEventListener("push", function (event) {
  const data = event.data?.json() ?? {};

  console.log("push data", data);

  const title = `${data.displayName} has gone live on twitch`;
  const body = `LIVE: ${data.title}`;
  const icon = "https://greencircle.live/assets/mrgreen.png";
  const image = data.thumbnail;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      image,
      tag: "team-green-notification",
      renotify: true,
      data: {
        url: `https://twitch.tv/${data.username}`,
      },
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
