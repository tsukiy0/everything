/* eslint-disable turbo/no-undeclared-env-vars */
"use client";

import { Amplify, Auth, Hub } from "aws-amplify";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext<{
  authenticated: boolean;
}>({
  authenticated: false,
});

Amplify.configure({
  Auth: {
    region: process.env.NEXT_PUBLIC_USER_POOL_REGION,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    mandatorySignIn: true,
    oauth: {
      domain: "auth.next.dev.everything.tsukiyo.io",
      scope: ["openid"],
      redirectSignIn: "http://localhost:3000",
      redirectSignOut: "http://localhost:3000",
      responseType: "code",
    },
  },
});

export const AuthContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const session = await Auth.currentSession();
        const token = session.getAccessToken();
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      }
    })();
  }, []);

  useEffect(() => {
    const listener = (data) => {
      switch (data.payload.event) {
        case "signIn":
          console.info("user signed in");
          console.log(data.payload);
          setAuthenticated(true);
          break;
        case "cognitoHostedUI":
          console.info("Cognito Hosted UI sign in successful");
          console.log(data.payload);
          break;
        default:
          console.log(data.payload);
      }
    };

    const unlisten = Hub.listen("auth", listener);

    return unlisten;
  }, [setAuthenticated]);

  if (!authenticated) {
    return (
      <>
        <div>login</div>
        <button onClick={() => Auth.federatedSignIn()}>login</button>
      </>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        authenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
