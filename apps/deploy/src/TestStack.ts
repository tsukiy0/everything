import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { CloudflareProvider } from "@cdktf/provider-cloudflare/lib/provider";
import { aws, cloudflare, tf } from "@tsukiy0/cdktf";
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

    new CloudflareProvider(this, "cloudflare", {});

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

    const domainName = "api.dev.everything.tsukiyo.io";
    const cloudflareZoneId = new tf.SecretStringVariable(
      this,
      "CLOUDFLARE_ZONE_ID"
    ).value();
    const apiCertificate = new aws.AcmCertificateForCloudflare(
      this,
      "api-acm-certificate",
      {
        domainName,
        cloudflareZoneId,
      }
    );

    const apiLambda = new aws.JsLambdaFunction(this, "api-lambda", {
      codePath: path.resolve(__dirname, "../dist/api"),
    });
    const lambdaHttpApi = new aws.LambdaHttpApi(this, "api-lambda-http-api", {
      lambdaFunction: apiLambda.lambdaFunction,
    }).withCustomDomain({
      domainName,
      acmCertificateValidation: apiCertificate.acmCertificateValidation,
    });
    new cloudflare.CNameDnsRecord(this, "api-cname-record", {
      zoneId: cloudflareZoneId,
      domainName,
      target: lambdaHttpApi.api.apiEndpoint.replace("https://", ""),
    });

    new aws.SecretStringParameter(this, "api-lambda-http-api-endpoint", {
      name: "/test/api-lambda-http-api-endpoint",
      value: lambdaHttpApi.api.apiEndpoint,
    });
  }
}
