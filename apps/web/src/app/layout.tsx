import { PropsWithChildren } from "react";

import { AuthContextProvider } from "../contexts/AuthContext";

const RootLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <AuthContextProvider>{children}</AuthContextProvider>
      </body>
    </html>
  );
};

export default RootLayout;
