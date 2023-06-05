"use client";

import { useQuery } from "@tanstack/react-query";
import React, { PropsWithChildren, useCallback } from "react";

import { useAuthContext } from "../contexts/AuthContext";
import { Private } from "./Private";

export const AuthContainer: React.FC<PropsWithChildren> = ({ children }) => {
  const auth = useAuthContext();
  const getPrivate = useCallback(async () => {
    if (auth.status !== "SIGNED_IN") {
      return;
    }

    const url = "https://api.dev.everything.tsukiyo.io/v1/private";

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Network response was not ok");
    }

    return res.text();
  }, [auth]);
  const privateQuery = useQuery({ queryKey: ["todos"], queryFn: getPrivate });

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
