import { fetchOAuthToken } from "./fetchOAuthToken";
import { getOAuthServiceUrlCreator } from "./oauthServiceUrlCreator";

interface IPersistenceProvider {
  readToken: () => string | null;
  saveToken: (token: string) => void;
  clearToken: () => void;
}

interface IOAuthConfigParam {
  key: string;
  serviceUrl: string;
  persistanceProvider?: IPersistenceProvider;
}

type DecoratedFetch = (token: string) => Promise<Response>;

interface IOAuthConfig {
  key: string;
  serviceUrl: string;
  persistanceProvider?: IPersistenceProvider;
}

const getBaseConfig = (key: string) => {
  return {
    persistanceProvider: {
      readToken: () => localStorage.getItem(`${key}-token`),
      saveToken: (token: string) => localStorage.setItem(`${key}-token`, token),
      clearToken: () => localStorage.removeItem(`${key}-token`)
    }
  };
};

async function callDecoratedFunction(
  decoratedFetch: DecoratedFetch,
  token: string,
  retry?: () => Promise<Response>
): Promise<Response> {
  const response = await decoratedFetch(token);
  if (retry && response.status === 401) return retry();
  return response;
}

export function connect(configParam: IOAuthConfig) {
  const config = { ...getBaseConfig(configParam.key), ...configParam };

  return {
    logout: config.persistanceProvider.clearToken,
    fetch: async function(
      input: RequestInfo,
      init?: RequestInit
    ): Promise<Response> {
      const tokenInStorage = config.persistanceProvider.readToken();

      const getToken = () => fetchOAuthToken(config.serviceUrl);
      const persist = (token: string) => {
        config.persistanceProvider.saveToken(token);
        return token;
      };
      const call = (token: string) =>
        fetch(input, {
          ...init,
          ...{
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        });

      if (tokenInStorage) {
        return callDecoratedFunction(call, tokenInStorage, () =>
          getToken()
            .then(persist)
            .then(call)
        );
      } else {
        return getToken()
          .then(persist)
          .then(call);
      }
    }
  };
}

export const oAuthUrlCreator = getOAuthServiceUrlCreator;
