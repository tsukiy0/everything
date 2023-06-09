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

    const defaultAwsProvider = new AwsProvider(this, "aws-default", {});
    const usEast1AwsProvider = new AwsProvider(this, "aws-us-east-1", {
      alias: "us-east-1",
      region: "us-east-1",
    });

    new CloudflareProvider(this, "cloudflare", {});

    const cloudflareZoneId = new tf.SecretStringVariable(
      this,
      "CLOUDFLARE_ZONE_ID"
    ).value();

    const loggingLambda = new aws.JsLambdaFunction(this, "logging-lambda", {
      codePath: path.resolve(__dirname, "../../backend/dist/logging"),
    });

    const queueConsumerLambda = new aws.JsLambdaFunction(
      this,
      "queue-consumer-lambda",
      {
        codePath: path.resolve(__dirname, "../../backend/dist/queueConsumer"),
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
        codePath: path.resolve(__dirname, "../../backend/dist/queueProducer"),
        environment: {
          QUEUE_URL: lambdaQueue.sqsQueue.url,
        },
      }
    );
    lambdaQueue.grantSend(queueProducerLambda.role);

    this.buildNextStaticSite({
      cloudflareZoneId,
      awsProvider: usEast1AwsProvider,
    });

    const oauthCognitoUserPool = this.buildOAuth({
      cloudflareZoneId,
      awsProvider: usEast1AwsProvider,
    });

    this.buildLambdaHttpApi({
      cloudflareZoneId,
      awsProvider: defaultAwsProvider,
      oauthCognitoUserPool: oauthCognitoUserPool,
    });
  }

  buildLambdaHttpApi = (props: {
    cloudflareZoneId: string;
    awsProvider: AwsProvider;
    oauthCognitoUserPool: aws.OAuthCognitoUserPool;
  }) => {
    const domainName = "api.dev.everything.tsukiyo.io";
    const certificate = new aws.AcmCertificateForCloudflare(
      this,
      "api-acm-certificate",
      {
        domainName: domainName,
        cloudflareZoneId: props.cloudflareZoneId,
        awsProvider: props.awsProvider,
      }
    );

    const lambda = new aws.JsLambdaFunction(this, "api-lambda", {
      codePath: path.resolve(__dirname, "../../backend/dist/api"),
      environment: {
        USER_POOL_ID: props.oauthCognitoUserPool.userPool.id,
        USER_POOL_CLIENT_ID: props.oauthCognitoUserPool.userPoolClient.id,
      },
    });
    const lambdaHttpApi = new aws.LambdaHttpApi(this, "api-lambda-http-api", {
      lambdaFunction: lambda.lambdaFunction,
    });
    const customDomain = lambdaHttpApi.withCustomDomain({
      domainName: domainName,
      acmCertificateValidation: certificate.acmCertificateValidation,
    });
    new cloudflare.CNameDnsRecord(this, "api-cname-record", {
      zoneId: props.cloudflareZoneId,
      domainName: domainName,
      target: customDomain.domainName.domainNameConfiguration.targetDomainName,
    });

    new aws.SecretStringParameter(this, "api-lambda-http-api-endpoint", {
      name: "/test/api-lambda-http-api-endpoint",
      value: lambdaHttpApi.api.apiEndpoint,
    });
  };

  buildNextStaticSite = (props: {
    cloudflareZoneId: string;
    awsProvider: AwsProvider;
  }) => {
    const domainName = "next.dev.everything.tsukiyo.io";
    const certificate = new aws.AcmCertificateForCloudflare(
      this,
      "next-acm-certificate",
      {
        domainName: domainName,
        cloudflareZoneId: props.cloudflareZoneId,
        awsProvider: props.awsProvider,
      }
    );
    const nextStaticSite = new aws.NextStaticSite(this, "next-static-site", {});
    nextStaticSite.withCustomDomain({
      domainName: domainName,
      acmCertificateValidation: certificate.acmCertificateValidation,
    });
    new cloudflare.CNameDnsRecord(this, "next-cname-record", {
      zoneId: props.cloudflareZoneId,
      domainName: domainName,
      target: nextStaticSite.distribution.domainName,
    });

    new aws.SecretStringParameter(this, "next-static-site-bucket", {
      name: "/test/next-static-site-bucket",
      value: nextStaticSite.bucket.bucket,
    });
  };

  buildOAuth = (props: {
    cloudflareZoneId: string;
    awsProvider: AwsProvider;
  }): aws.OAuthCognitoUserPool => {
    const domainName = "auth.next.dev.everything.tsukiyo.io";
    const certificate = new aws.AcmCertificateForCloudflare(
      this,
      "auth-acm-certificate",
      {
        domainName: domainName,
        cloudflareZoneId: props.cloudflareZoneId,
        awsProvider: props.awsProvider,
      }
    );

    const callbackUrl = "https://next.dev.everything.tsukiyo.io/auth/";
    const oauthPool = new aws.OAuthCognitoUserPool(this, "oauth-pool", {
      signInCallbackUrls: [callbackUrl, "http://localhost:3000/auth/"],
      signOutCallbackUrls: [callbackUrl, "http://localhost:3000/auth/"],
    });

    const userPoolDomain = oauthPool.withCustomDomain({
      domainName,
      acmCertificateValidation: certificate.acmCertificateValidation,
    });

    new cloudflare.CNameDnsRecord(this, "auth-cname-record", {
      zoneId: props.cloudflareZoneId,
      domainName: domainName,
      target: userPoolDomain.cloudfrontDistribution,
    });

    new aws.SecretStringParameter(this, "auth-user-pool-region", {
      name: "/test/auth-user-pool-region",
      value: "us-west-2",
    });

    new aws.SecretStringParameter(this, "auth-user-pool-id", {
      name: "/test/auth-user-pool-id",
      value: oauthPool.userPool.id,
    });

    new aws.SecretStringParameter(this, "auth-user-pool-client-id", {
      name: "/test/auth-user-pool-client-id",
      value: oauthPool.userPoolClient.id,
    });

    new aws.SecretStringParameter(this, "auth-user-pool-domain", {
      name: "/test/auth-user-pool-domain",
      value: domainName,
    });

    new aws.SecretStringParameter(this, "auth-user-pool-callback-url", {
      name: "/test/auth-user-pool-callback-url",
      value: callbackUrl,
    });

    return oauthPool;
  };
}
