import type { FC } from "hono/jsx";
import { Header } from "./header";
import { Session } from "../middleware/session";

type Props = {
  session: Session;
  children: any;
};

export const MainLayout: FC<Props> = ({ session, children }) => {
  return (
    <html class="dark">
      <head>
        <meta charset="utf-8" />
        <title>computer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="A computer" />
        <meta name="author" content="ellg" />
        <script defer src="/lib/htmx.min.js"></script>
        <script defer src="/js/site.js"></script>
      </head>
      <body class="bg-gray-900 text-gray-100 min-h-screen flex flex-col font-sans">
        <Header session={session} />
        {children}
      </body>
    </html>
  );
};
