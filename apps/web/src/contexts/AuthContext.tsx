/* eslint-disable turbo/no-undeclared-env-vars */
"use client";

import { CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";
import { Amplify, Auth, Hub } from "aws-amplify";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthContextValue =
  | {
      status: "NOT_SIGNED_IN";
      signIn: () => void;
    }
  | {
      status: "SIGNING_IN";
    }
  | {
      status: "SIGNED_IN";
      signOut: () => void;
      token: string;
    };

const AuthContext = createContext<AuthContextValue>({} as any);

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

export const AuthContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [status, setStatus] = useState<
    "NOT_SIGNED_IN" | "SIGNING_IN" | "SIGNED_IN"
  >("SIGNING_IN");
  const [token, setToken] = useState<string>(undefined);

  const getToken = useCallback(async (): Promise<void> => {
    try {
      const session = await Auth.currentSession();
      const token = session.getAccessToken().getJwtToken();
      setStatus("SIGNED_IN");
      setToken(token);
    } catch {
      setStatus("NOT_SIGNED_IN");
      setToken(undefined);
    }
  }, []);

  useEffect(() => {
    getToken();
  }, [getToken]);

  useEffect(() => {
    const listener = async (data) => {
      switch (data.payload.event) {
        case "signIn":
          console.info("user signed in");
          console.log(data.payload);
          await getToken();
          break;
        case "signIn_failure":
          console.error("user sign in failed");
          break;
        case "signOut":
          console.info("user signed out");
          setStatus("NOT_SIGNED_IN");
          setToken(undefined);
          break;
        default:
          console.log(data.payload);
      }
    };

    const unlisten = Hub.listen("auth", listener);

    return unlisten;
  }, [getToken]);

  switch (status) {
    case "NOT_SIGNED_IN":
      return (
        <AuthContext.Provider
          value={{
            status,
            signIn: () =>
              Auth.federatedSignIn({
                provider: CognitoHostedUIIdentityProvider.Cognito,
                customState: "hello",
              }),
          }}
        >
          {children}
        </AuthContext.Provider>
      );
    case "SIGNING_IN":
      return (
        <AuthContext.Provider
          value={{
            status,
          }}
        >
          {children}
        </AuthContext.Provider>
      );
    case "SIGNED_IN":
      return (
        <AuthContext.Provider
          value={{
            status,
            token,
            signOut: () => Auth.signOut(),
          }}
        >
          {children}
        </AuthContext.Provider>
      );
  }
};

export const useAuthContext = () => useContext(AuthContext);
