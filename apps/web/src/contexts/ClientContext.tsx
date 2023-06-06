/* eslint-disable turbo/no-undeclared-env-vars */
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { aws } from "@tsukiy0/core-react";
import React, { PropsWithChildren } from "react";

const queryClient = new QueryClient();

export const ClientContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <aws.OAuthCognitoContextProvider
        config={{
          region: process.env.NEXT_PUBLIC_USER_POOL_REGION,
          userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
          userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
          domain: process.env.NEXT_PUBLIC_USER_POOL_DOMAIN,
          signInCallbackUrl:
            process.env.NEXT_PUBLIC_USER_POOL_SIGN_IN_CALLBACK_URL,
          signOutCallbackUrl:
            process.env.NEXT_PUBLIC_USER_POOL_SIGN_OUT_CALLBACK_URL,
        }}
      >
        {children}
      </aws.OAuthCognitoContextProvider>
    </QueryClientProvider>
  );
};
