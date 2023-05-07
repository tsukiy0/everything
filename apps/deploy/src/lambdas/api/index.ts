import serverlessExpress from "@vendia/serverless-express";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import express from "express";

let serverlessExpressInstance: any;

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context);
  }

  const app = express();
  app.get("/v1/healthcheck", (_, res) => {
    res.status(200).send("OK");
  });

  serverlessExpressInstance = serverlessExpress({ app });
  return serverlessExpressInstance(event, context);
};
