import * as jwt from "jsonwebtoken";

import type { SignedPayload } from "@commune-ts/types";

import { verifySignedData } from "./sign";

// Map<nonce, timestamp>
const seenNonces = new Map<string, number>();
let lastNonceCleanup = Date.now();

interface TokenData {
  userKey: string;
  uri: string;
}

const jwtOptions = (): jwt.SignOptions => ({
  algorithm: "HS256",
  issuer: "commune-ts",
  expiresIn: "6h",
});

export const createSessionToken = async (signedSessionData: SignedPayload) => {
  const { address, data } = await verifySignedData(signedSessionData);

  // check if the sessionData is not older than 10 minutes
  if (new Date(data.created).getTime() + 10 * 60 * 1000 < Date.now()) {
    throw new Error("Session data is too old");
  }

  if (seenNonces.has(data.nonce)) {
    throw new Error("Nonce has been used before");
  }

  // cleanup old nonces every hour
  if (lastNonceCleanup + 60 * 60 * 1000 < Date.now()) {
    for (const [nonce, timestamp] of seenNonces.entries()) {
      if (timestamp + 60 * 60 * 1000 < Date.now()) {
        seenNonces.delete(nonce);
      }
    }
    lastNonceCleanup = Date.now();
  }

  seenNonces.set(data.nonce, Date.now());

  const tokenData: TokenData = {
    userKey: address,
    uri: data.uri,
  };

  const token = jwt.sign(
    tokenData,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.JWT_SECRET!,
    jwtOptions(),
  );

  return token;
};

export const decodeJwtSessionToken = (token: string): { userKey: string } => {
  const { userKey } = jwt.verify(
    token,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.JWT_SECRET!,
    jwtOptions(),
  ) as TokenData;

  return { userKey };
};

export function isJwtTokenValid(token: string) {
  try {
    const decodedToken = jwt.verify(
      token,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      process.env.JWT_SECRET!,
      {
        algorithms: ["HS256"],
        issuer: "commune-ts",
      },
    ) as jwt.JwtPayload;

    // Check if the token has expired
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decodedToken.exp && decodedToken.exp < currentTimestamp) {
      return false; // Token has expired
    }

    // Checking if the token was issued in the past:
    if (decodedToken.iat && decodedToken.iat > currentTimestamp) {
      return false; // Token was issued in the future
    }

    return true; // Token is valid and not expired
  } catch (error) {
    // Token is invalid (e.g., signature mismatch, malformed)
    console.log(error);
    return false;
  }
}
