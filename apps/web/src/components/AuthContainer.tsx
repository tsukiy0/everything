"use client";

import { aws } from "@tsukiy0/core-react";
import React, { PropsWithChildren } from "react";

import { Private } from "./Private";

export const AuthContainer: React.FC<PropsWithChildren> = ({ children }) => {
  const auth = aws.useOAuthCognitoContext();
  switch (auth.status) {
    case "SIGNED_OUT":
      return (
        <div>
          <button onClick={auth.signIn}>sign in</button>
        </div>
      );
    case "LOADING":
      return <div>signing in...</div>;
    case "SIGNED_IN":
      return (
        <div>
          <button onClick={auth.signOut}>sign out</button>
          <Private />
          <div>{children}</div>
        </div>
      );
  }
};
