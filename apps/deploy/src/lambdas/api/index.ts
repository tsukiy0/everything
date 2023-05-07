import { LambdaSingleton } from "@tsukiy0/core-aws";
import serverlessExpress from "@vendia/serverless-express";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import express from "express";

const serverlessExpressSingleton = new LambdaSingleton<any>(async () => {
  const app = express();
  app.get("/v1/healthcheck", (_, res) => {
    res.status(200).send("OK");
  });

  serverlessExpressInstance = serverlessExpress({ app });

  return serverlessExpressInstance;
});

let serverlessExpressInstance: any;

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const serverlessExpressInstance = await serverlessExpressSingleton.get();
  return serverlessExpressInstance(event, context);
};
