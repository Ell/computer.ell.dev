import { FC } from "hono/jsx";

import { MainLayout } from "../layouts/main";
import { Session } from "../middleware/session";

type Props = {
  session: Session;
  twitch: {
    appToken: string;
    userToken: string;
    userRefreshToken: string;
  };
};

export const AdminPage: FC<Props> = ({ session, twitch }) => {
  return (
    <MainLayout session={session}>
      <div class="flex flex-col p-8 mx-16">
        <h1 class="text-4xl font-bold text-white">Admin</h1>
        <div class="p-8 mt-8 bg-gray-950 w-full border border-neutral-800 rounded-lg">
          <h1 class="text-2xl font-bold text-white">Twitch OAuth</h1>
          <div class="mt-4">
            <div class="text-white">
              <p>App Token: {twitch.appToken}</p>
              <p>User Token: {twitch.userToken}</p>
              <p>User Refresh Token: {twitch.userRefreshToken}</p>
            </div>
          </div>
          <div class="mt-4">
            <a
              href="/admin/twitch/refresh"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Refresh Twitch Tokens
            </a>
          </div>
        </div>
        <div class="p-8 mt-8 bg-gray-950 w-full border border-neutral-800 rounded-lg">
          <h1 class="text-2xl font-bold text-white">Twitch Eventsub</h1>
          <div class="mt-4">
            <button
              href="/admin/twitch/team/refresh"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg"
              hx-post="/admin/twitch/team/refresh"
              hx-swap="none"
            >
              Refresh Twitch Subscriptions
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
