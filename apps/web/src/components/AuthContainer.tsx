"use client";

import React, { PropsWithChildren } from "react";

import { useAuthContext } from "../contexts/AuthContext";

export const AuthContainer: React.FC<PropsWithChildren> = ({ children }) => {
  const auth = useAuthContext();

  switch (auth.status) {
    case "NOT_SIGNED_IN":
      return (
        <div>
          <button onClick={auth.signIn}>sign in</button>
        </div>
      );
    case "SIGNING_IN":
      return <div>signing in...</div>;
    case "SIGNED_IN":
      return (
        <div>
          <button onClick={auth.signOut}>sign out</button>
          <div>{children}</div>
        </div>
      );
  }
};
