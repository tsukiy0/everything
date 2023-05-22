import serverlessExpress from "@vendia/serverless-express";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import * as express from "express";

import { LambdaSingleton } from "./LambdaSingleton";

export class ExpressHandlerBuilder {
  private app?: () => Promise<express.Application>;

  withApp = (
    app: () => Promise<express.Application>
  ): ExpressHandlerBuilder => {
    this.app = app;

    return this;
  };

  build = (): APIGatewayProxyHandlerV2 => {
    if (!this.app) {
      throw new Error("app is required");
    }

    const app = this.app;

    const serverlessExpressSingleton = new LambdaSingleton<any>(async () => {
      const serverlessExpressInstance = serverlessExpress({ app: await app() });
      return serverlessExpressInstance;
    });

    const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
      const serverlessExpressInstance = await serverlessExpressSingleton.get();
      return serverlessExpressInstance(event, context);
    };

    return handler;
  };
}
