import { PropsWithChildren } from "react";

import { ClientContextProvider } from "../contexts/ClientContext";

const RootLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <ClientContextProvider>{children}</ClientContextProvider>
      </body>
    </html>
  );
};

export default RootLayout;
