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
        <p class="text-base md:text-xl text-gray-400 max-w-3xl mb-10">
          (Computer(Computer(Computer(Computer(Computer(Computer(Computer)))))))
          (((((((Computer)Computer)Computer)Computer)Computer)Computer)Computer)
          (Computer(Computer(Computer(Computer(Computer(Computer(Computer)))))))
          (((((((Computer)Computer)Computer)Computer)Computer)Computer)Computer)
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
          <div class="flex flex-wrap w-1/2 item-center justify-between gap-10">
            <a
              href="/redeem/gamer"
              class="grow bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105"
            >
              Gamer Button
            </a>

            <a
              href="/redeem/superidol"
              class="grow bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105"
            >
              Super Idol
            </a>

            <a
              href="/redeem/selfhex"
              class="grow bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105"
            >
              Self Hex
            </a>

            <a
              href="/redeem/besttheme"
              class="grow bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105"
            >
              Best Theme
            </a>

            <a
              href="/redeem/forsen"
              class="grow bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105"
            >
              Forsen
            </a>

            <a
              href="/redeem/superforsen"
              class="grow bg-purple-500 hover:bg-purple-900 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105"
            >
              Super Forsen
            </a>

            <a
              href="/redeem/everything"
              class="grow bg-white hover:bg-red-900 text-white font-bold py-3 px-8 rounded-full transition duration-1000 hover:scale-150"
            >
              Literally Everything at Once
            </a>
          </div>
        )}
      </main>
    </MainLayout>
  );
};
