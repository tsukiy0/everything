import { ExpressHandlerBuilder } from "@tsukiy0/core-aws";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import express from "express";

export const handler: APIGatewayProxyHandlerV2 = new ExpressHandlerBuilder()
  .withApp(async () => {
    const app = express();
    app.get("/v1/healthcheck", (_, res) => {
      res.status(200).send("OK");
    });

    return app;
  })
  .build();
