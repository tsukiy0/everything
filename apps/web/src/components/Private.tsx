"use client";

import { useQuery } from "@tanstack/react-query";
import { aws } from "@tsukiy0/core-react";
import React, { useCallback } from "react";

export const Private: React.FC = () => {
  const auth = aws.useOAuthCognitoContext();
  const getPrivate = useCallback(async () => {
    if (auth.status !== "SIGNED_IN") {
      return;
    }

    const url = "https://api.dev.everything.tsukiyo.io/v1/private";

    const res = await fetch(url, {
      headers: {
        Authorization: `${auth.token}`,
      },
    });
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
