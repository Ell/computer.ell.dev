import { FC } from "hono/jsx";

import { MainLayout } from "../layouts/main";
import { Session } from "../middleware/session";

type Props = {
  session: Session;
};

export const IndexPage: FC<Props> = ({ session }) => {
  return (
    <MainLayout session={session}>
      <main class="container mx-auto px-6 py-16 flex-grow flex flex-col justify-center items-center text-center">
        <h1 class="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-blue-500">
          Welcome to Computer
        </h1>
        <p class="text-xl md:text-2xl text-gray-400 max-w-3xl mb-10">
          Computer Computer Computer Computer Computer Computer Computer
          Computer Computer Computer Computer Computer Computer Computer
          Computer Computer Computer Computer Computer Computer Computer
          Computer
        </p>
        {session.data.user === undefined && (
          <a
            href="/login"
            class="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105"
          >
            Login to Computer
          </a>
        )}
        {session.data.user !== undefined && (
          <>
            <a
              href="/gamer"
              class="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105"
            >
              Gamer Button
            </a>
            <button
              onclick="onSubscribeClicked()"
              title="Subscribe to get notified when anyone in Team Green goes live"
              class="mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105"
            >
              Subscribe to Team Green
            </button>
          </>
        )}
        {session.data.user?.username === "ellg" && (
          <a
            href="/admin"
            class="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105 mt-4"
          >
            Admin Panel
          </a>
        )}
      </main>
    </MainLayout>
  );
};
