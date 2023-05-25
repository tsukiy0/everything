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

    const defaultProvider = new AwsProvider(this, "aws-default", {});
    const usEast1AwsProvider = new AwsProvider(this, "aws-us-east-1", {
      alias: "us-east-1",
      region: "us-east-1",
    });

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

    const apiDomainName = "api.dev.everything.tsukiyo.io";
    const cloudflareZoneId = new tf.SecretStringVariable(
      this,
      "CLOUDFLARE_ZONE_ID"
    ).value();
    const apiCertificate = new aws.AcmCertificateForCloudflare(
      this,
      "api-acm-certificate",
      {
        domainName: apiDomainName,
        cloudflareZoneId,
        awsProvider: defaultProvider,
      }
    );

    const apiLambda = new aws.JsLambdaFunction(this, "api-lambda", {
      codePath: path.resolve(__dirname, "../dist/api"),
    });
    const lambdaHttpApi = new aws.LambdaHttpApi(this, "api-lambda-http-api", {
      lambdaFunction: apiLambda.lambdaFunction,
    });
    const customDomain = lambdaHttpApi.withCustomDomain({
      domainName: apiDomainName,
      acmCertificateValidation: apiCertificate.acmCertificateValidation,
    });
    new cloudflare.CNameDnsRecord(this, "api-cname-record", {
      zoneId: cloudflareZoneId,
      domainName: apiDomainName,
      target: customDomain.domainName.domainNameConfiguration.targetDomainName,
    });

    const nextDomainName = "next.dev.everything.tsukiyo.io";
    const nextCertificate = new aws.AcmCertificateForCloudflare(
      this,
      "next-acm-certificate",
      {
        domainName: nextDomainName,
        cloudflareZoneId,
        awsProvider: usEast1AwsProvider,
      }
    );
    const nextStaticSite = new aws.NextStaticSite(this, "next-static-site", {});
    nextStaticSite.withCustomDomain({
      domainName: nextDomainName,
      acmCertificateValidation: nextCertificate.acmCertificateValidation,
    });
    new cloudflare.CNameDnsRecord(this, "next-cname-record", {
      zoneId: cloudflareZoneId,
      domainName: nextDomainName,
      target: nextStaticSite.distribution.domainName,
    });

    new aws.SecretStringParameter(this, "api-lambda-http-api-endpoint", {
      name: "/test/api-lambda-http-api-endpoint",
      value: lambdaHttpApi.api.apiEndpoint,
    });

    new aws.SecretStringParameter(this, "next-static-site-bucket", {
      name: "/test/next-static-site-bucket",
      value: nextStaticSite.bucket.bucket,
    });
  }
}
