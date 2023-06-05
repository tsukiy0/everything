"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useCallback } from "react";

import { useAuthContext } from "../contexts/AuthContext";

export const Private: React.FC = () => {
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

  if (privateQuery.isLoading) {
    return <div>loading...</div>;
  }

  return <div>{privateQuery.data}</div>;
};
