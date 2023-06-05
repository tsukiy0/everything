import { ConsoleLogger } from "@tsukiy0/core";
import { ExpressHandlerBuilder } from "@tsukiy0/core-aws";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import cors from "cors";
import express from "express";
import { z } from "zod";

const Env = z.object({
  USER_POOL_ID: z.string(),
  USER_POOL_CLIENT_ID: z.string(),
});

const env = Env.parse(process.env);

const JwtVerifier = CognitoJwtVerifier.create({
  userPoolId: env.USER_POOL_ID,
  tokenUse: "access",
  clientId: env.USER_POOL_CLIENT_ID,
});

const logger = new ConsoleLogger();

export const handler: APIGatewayProxyHandlerV2 = new ExpressHandlerBuilder()
  .withApp(async () => {
    const app = express();

    app.use(
      cors({
        origin: "*",
      })
    );

    app.get("/v1/healthcheck", (_, res) => {
      res.status(200).send("OK");
    });

    app.get(
      "/v1/private",
      (req, res, next) => {
        if (!req.headers.authorization) {
          res.status(403).end();
          return;
        }

        try {
          const payload = JwtVerifier.verifySync(req.headers.authorization!);
          logger.info("jwt verified", { payload });
          next();
        } catch (e) {
          logger.error(e);
          res.status(403).end();
        }
      },
      (_, res) => {
        res.status(200).send("private :)");
      }
    );

    return app;
  })
  .build();
