import {
  APIGatewayProxyStructuredResultV2,
  Callback,
  Context,
} from "aws-lambda";
import express from "express";

import { ExpressHandlerBuilder } from "./ExpressHandlerBuilder";

describe("ExpressHandlerBuilder", () => {
  it("throws when no app provided", () => {
    expect(() => {
      new ExpressHandlerBuilder().build();
    }).toThrowError("app is required");
  });

  it("handles", async () => {
    // arrange
    const expressHandler = new ExpressHandlerBuilder()
      .withApp(async () => {
        const app = express();
        app.get("/v1/healthcheck", (_, res) => {
          res.send("OK");
        });

        return app;
      })
      .build();

    // act
    const got = (await expressHandler(
      buildEvent({
        path: "/v1/healthcheck",
      }),
      {} as Context,
      (() => {}) as Callback
    )) as APIGatewayProxyStructuredResultV2;

    // assert
    expect(got.statusCode).toEqual(200);
    expect(got.body).toEqual("OK");
  });
});

const buildEvent = (opts: { path: string }) => {
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: opts.path,
    rawQueryString: "parameter1=value1&parameter1=value2&parameter2=value",
    cookies: ["cookie1", "cookie2"],
    headers: {
      header1: "value1",
      header2: "value1,value2",
    },
    queryStringParameters: {
      parameter1: "value1,value2",
      parameter2: "value",
    },
    requestContext: {
      accountId: "123456789012",
      apiId: "api-id",
      authentication: {
        clientCert: {
          clientCertPem: "CERT_CONTENT",
          subjectDN: "www.example.com",
          issuerDN: "Example issuer",
          serialNumber: "a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1",
          validity: {
            notBefore: "May 28 12:30:02 2019 GMT",
            notAfter: "Aug  5 09:36:04 2021 GMT",
          },
        },
      },
      authorizer: {
        jwt: {
          claims: {
            claim1: "value1",
            claim2: "value2",
          },
          scopes: ["scope1", "scope2"],
        },
      },
      domainName: "id.execute-api.us-east-1.amazonaws.com",
      domainPrefix: "id",
      http: {
        method: "GET",
        path: opts.path,
        protocol: "HTTP/1.1",
        sourceIp: "192.0.2.1",
        userAgent: "agent",
      },
      requestId: "id",
      routeKey: "$default",
      stage: "$default",
      time: "12/Mar/2020:19:03:58 +0000",
      timeEpoch: 1583348638390,
    },
    body: "Hello from Lambda",
    pathParameters: {
      parameter1: "value1",
    },
    isBase64Encoded: false,
    stageVariables: {
      stageVariable1: "value1",
      stageVariable2: "value2",
    },
  };
};