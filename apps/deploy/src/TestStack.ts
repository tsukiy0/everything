import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { aws } from "@tsukiy0/cdktf";
import { CloudBackend, NamedCloudWorkspace, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import path from "path";

export class TestStack extends TerraformStack {
  constructor(
    scope: Construct,
    name: string,
    props: {
      terraform: {
        organization: string;
        workspace: string;
      };
    }
  ) {
    super(scope, name);

    new CloudBackend(this, {
      hostname: "app.terraform.io",
      organization: props.terraform.organization,
      workspaces: new NamedCloudWorkspace(props.terraform.workspace),
    });

    new AwsProvider(this, "aws", {});

    const loggingLambda = new aws.JsLambdaFunction(this, "logging-lambda", {
      codePath: path.resolve(__dirname, "../dist/logging"),
    });

    const queueConsumerLambda = new aws.JsLambdaFunction(
      this,
      "queue-consumer-lambda",
      {
        codePath: path.resolve(__dirname, "../dist/queueConsumer"),
      }
    );
    const lambdaQueue = new aws.LambdaSqsQueue(this, "lambda-queue", {
      lambdaFunction: queueConsumerLambda.lambdaFunction,
      lambdaFunctionRole: queueConsumerLambda.role,
      enabled: true,
      maxRetries: 1,
      batchSize: 5,
    });

    const queueProducerLambda = new aws.JsLambdaFunction(
      this,
      "queue-producer-lambda",
      {
        codePath: path.resolve(__dirname, "../dist/queueProducer"),
        environment: {
          QUEUE_URL: lambdaQueue.sqsQueue.url,
        },
      }
    );
    lambdaQueue.grantSend(queueProducerLambda.role);

    const apiLambda = new aws.JsLambdaFunction(this, "api-lambda", {
      codePath: path.resolve(__dirname, "../dist/api"),
    });
    const lambdaHttpApi = new aws.LambdaHttpApi(this, "api-lambda-http-api", {
      lambdaFunction: apiLambda.lambdaFunction,
    });
    new aws.SecretStringParameter(this, "api-lambda-http-api-endpoint", {
      name: "/test/api-lambda-http-api-endpoint",
      value: lambdaHttpApi.api.apiEndpoint,
    });
  }
}
