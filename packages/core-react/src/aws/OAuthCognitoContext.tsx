import { CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";
import { Auth, Hub } from "aws-amplify";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Value =
  | {
      status: "SIGNED_OUT";
      signIn: () => void;
    }
  | {
      status: "LOADING";
    }
  | {
      status: "SIGNED_IN";
      signOut: () => void;
      token: string;
    };

const Context = createContext<Value>({} as any);

export const OAuthCognitoContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, setState] = useState<
    | {
        status: "SIGNED_IN";
        token: string;
      }
    | {
        status: "SIGNED_OUT";
      }
    | {
        status: "LOADING";
      }
  >({ status: "LOADING" });

  const getToken = useCallback(async (): Promise<void> => {
    try {
      const session = await Auth.currentSession();
      const token = session.getAccessToken().getJwtToken();
      setState({
        status: "SIGNED_IN",
        token,
      });
    } catch {
      setState({
        status: "SIGNED_OUT",
      });
    }
  }, []);

  useEffect(() => {
    getToken();
  }, [getToken]);

  useEffect(() => {
    const listener: Parameters<typeof Hub.listen>[1] = async (data) => {
      switch (data.payload.event) {
        case "signIn":
          await getToken();
          break;
        case "signIn_failure":
          console.error("user sign in failed");
          break;
        case "signOut":
          setState({
            status: "SIGNED_OUT",
          });
          break;
        default:
          console.log(data.payload);
      }
    };

    const unlisten = Hub.listen("auth", listener);

    return unlisten;
  }, [getToken]);

  switch (state.status) {
    case "SIGNED_OUT":
      return (
        <Context.Provider
          value={{
            status: state.status,
            signIn: () =>
              Auth.federatedSignIn({
                provider: CognitoHostedUIIdentityProvider.Cognito,
              }),
          }}
        >
          {children}
        </Context.Provider>
      );
    case "LOADING":
      return (
        <Context.Provider
          value={{
            status: state.status,
          }}
        >
          {children}
        </Context.Provider>
      );
    case "SIGNED_IN":
      return (
        <Context.Provider
          value={{
            status: state.status,
            token: state.token,
            signOut: () => Auth.signOut(),
          }}
        >
          {children}
        </Context.Provider>
      );
  }
};

export const useOAuthCognitoContext = () => useContext(Context);
