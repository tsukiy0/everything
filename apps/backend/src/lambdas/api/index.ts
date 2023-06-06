import { ConsoleLogger } from "@tsukiy0/core";
import {
  CognitoJwtAuthMiddleware,
  ExpressHandlerBuilder,
} from "@tsukiy0/core-aws";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import cors from "cors";
import express from "express";
import { z } from "zod";

const Env = z.object({
  USER_POOL_ID: z.string(),
  USER_POOL_CLIENT_ID: z.string(),
});

const env = Env.parse(process.env);

const logger = new ConsoleLogger();

export const handler: APIGatewayProxyHandlerV2 = new ExpressHandlerBuilder()
  .withApp(async () => {
    const app = express();
    const cognitoJwtAuthMiddleware = CognitoJwtAuthMiddleware({
      userPoolId: env.USER_POOL_ID,
      userPoolClientId: env.USER_POOL_CLIENT_ID,
    });

    app.use(
      cors({
        origin: "*",
      })
    );

    app.get("/v1/healthcheck", (_, res) => {
      res.status(200).send("OK");
    });

    app.get("/v1/private", cognitoJwtAuthMiddleware, (_, res) => {
      res.status(200).json(res.locals.cognitoJwtPayload);
    });

    return app;
  })
  .build();
