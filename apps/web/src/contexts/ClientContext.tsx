/* eslint-disable turbo/no-undeclared-env-vars */
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { aws } from "@tsukiy0/core-react";
import { Amplify } from "aws-amplify";
import React, { PropsWithChildren } from "react";

const queryClient = new QueryClient();

Amplify.configure({
  Auth: {
    region: process.env.NEXT_PUBLIC_USER_POOL_REGION,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    mandatorySignIn: true,
    oauth: {
      domain: process.env.NEXT_PUBLIC_USER_POOL_DOMAIN,
      scope: ["openid"],
      redirectSignIn: process.env.NEXT_PUBLIC_USER_POOL_SIGN_IN_CALLBACK_URL,
      redirectSignOut: process.env.NEXT_PUBLIC_USER_POOL_SIGN_OUT_CALLBACK_URL,
      responseType: "code",
    },
  },
});

export const ClientContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <aws.OAuthCognitoContextProvider>
        {children}
      </aws.OAuthCognitoContextProvider>
    </QueryClientProvider>
  );
};
