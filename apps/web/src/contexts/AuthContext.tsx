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
    region: "us-west-2",
    userPoolId: "us-west-2_IPJRhFbBR",
    userPoolWebClientId: "5n8k1piafgvgak0n0fuphpdgh1",
    mandatorySignIn: true,
    oauth: {
      domain: "auth.next.dev.everything.tsukiyo.io",
      scope: ["openid", "email", "profile"],
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
