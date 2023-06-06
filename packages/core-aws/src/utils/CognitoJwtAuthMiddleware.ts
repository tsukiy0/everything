import { CognitoJwtVerifier } from "aws-jwt-verify";
import { Handler } from "express";

export const CognitoJwtAuthMiddleware = (config: {
  userPoolId: string;
  userPoolClientId: string;
}): Handler => {
  const JwtVerifier = CognitoJwtVerifier.create({
    userPoolId: config.userPoolId,
    tokenUse: "access",
    clientId: config.userPoolClientId,
  });

  return (req, res, next) => {
    (async () => {
      if (!req.headers.authorization) {
        res.status(403).end();
        return;
      }

      try {
        const payload = await JwtVerifier.verify(req.headers.authorization!);
        res.locals.cognitoJwtPayload = payload;
        next();
      } catch (e) {
        res.status(403).end();
      }
    })().catch(next);
  };
};
