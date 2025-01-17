import { FC } from "hono/jsx";
import { Session } from "../middleware/session";

type Props = {
  session: Session;
};

export const Header: FC<Props> = ({ session }) => {
  const authenticated = session.data.user !== undefined;

  return (
    <header class="bg-gray-800 shadow-lg">
      <nav class="container mx-auto px-4 py-2">
        <div class="flex items-center justify-between">
          <div class="text-xl font-bold text-primary-400">
            <a
              href="#"
              class="hover:text-primary-300 transition-colors duration-300"
            >
              COMPUTER ZONE
            </a>
          </div>
          {authenticated && (
            <>
              <div class="hidden md:flex items-center space-x-6">
                <span class="text-sm font-medium">
                  {session.data.user?.username}
                </span>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
