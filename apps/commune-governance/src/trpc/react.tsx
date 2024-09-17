"use client";

import type { TRPCLink } from "@trpc/client";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  loggerLink,
  TRPCClientError,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { observable } from "@trpc/server/observable";
import SuperJSON from "superjson";

import type { AppRouter } from "@commune-ts/api";
import { useCommune } from "@commune-ts/providers/use-commune";
import { createSessionData, signData } from "@commune-ts/utils";

import { env } from "~/env";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
    },
  });

let clientQueryClientSingleton: QueryClient | undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  } else {
    if (!clientQueryClientSingleton) {
      clientQueryClientSingleton = createQueryClient();
    }
    return clientQueryClientSingleton;
  }
};

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const { signHex } = useCommune();

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authenticateUser = async () => {
    if (isAuthenticating) {
      console.log("Already authenticating, skipping.");
      return;
    }
    setIsAuthenticating(true);

    try {
      const sessionData = createSessionData(window);
      const signedData = await signData(signHex, sessionData);

      const authClient = createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: getBaseUrl() + "/api/trpc",
            transformer: SuperJSON,
          }),
        ],
      });

      const result = await authClient.auth.startSession.mutate(signedData);

      if (result.token && result.authenticationType) {
        const authorization = `${result.authenticationType} ${result.token}`;
        localStorage.setItem("authorization", authorization);
        console.log("Authentication successful");
      } else {
        throw new Error("Invalid authentication response");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const trpcClient = api.createClient({
    links: [
      createAuthLink(authenticateUser),
      loggerLink({
        enabled: (op) =>
          env.NODE_ENV === "development" ||
          (op.direction === "down" && op.result instanceof Error),
      }),
      httpBatchLink({
        url: getBaseUrl() + "/api/trpc",
        headers() {
          const headers: Record<string, string> = {};
          headers["x-trpc-source"] = "nextjs-react";
          const authorization = localStorage.getItem("authorization");
          if (authorization) {
            headers.authorization = authorization;
          }
          return headers;
        },
        transformer: SuperJSON,
      }),
    ],
  });

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function createAuthLink(
  authenticateUser: () => Promise<void>,
): TRPCLink<AppRouter> {
  return () => {
    return ({ op, next }) => {
      return observable<unknown, Error | TRPCClientError<AppRouter>>(
        (observer) => {
          let retried = false;

          const execute = () => {
            const subscription = next(op).subscribe({
              next: (result) => {
                observer.next(result);
              },
              error: (err) => {
                if (
                  !retried &&
                  err instanceof TRPCClientError &&
                  err.data?.code === "UNAUTHORIZED"
                ) {
                  retried = true;
                  authenticateUser()
                    .then(() => {
                      op.context.headers = {
                        ...(op.context.headers ?? {}),
                        authorization:
                          localStorage.getItem("authorization") ?? "",
                      };
                      execute();
                    })
                    .catch((error) => {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                      observer.error(error);
                    });
                } else {
                  observer.error(err);
                }
              },
              complete: () => {
                observer.complete();
              },
            });

            return () => {
              subscription.unsubscribe();
            };
          };

          return execute();
        },
      );
    };
  };
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`;
};