import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { CloudwatchQueryDefinition } from "@cdktf/provider-aws/lib/cloudwatch-query-definition";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { LambdaFunctionEventInvokeConfig } from "@cdktf/provider-aws/lib/lambda-function-event-invoke-config";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3Object } from "@cdktf/provider-aws/lib/s3-object";
import { AssetType, TerraformAsset } from "cdktf";
import { Construct } from "constructs";

export class JsLambdaFunction extends Construct {
  public readonly lambdaFunction: LambdaFunction;
  public readonly role: IamRole;
  public readonly logGroup: CloudwatchLogGroup;

  public constructor(
    scope: Construct,
    id: string,
    props: {
      codePath: string;
      environment?: Record<string, string>;
      timeout?: number;
      memorySize?: number;
    }
  ) {
    super(scope, id);

    const asset = new TerraformAsset(this, "asset", {
      path: props.codePath,
      type: AssetType.ARCHIVE,
    });

    const bucket = new S3Bucket(this, "bucket", {
      bucketPrefix: "lambda-code",
      forceDestroy: true,
    });

    const code = new S3Object(this, "code", {
      bucket: bucket.bucket,
      key: "code.zip",
      source: asset.path,
    });

    const role = new IamRole(this, "role", {
      namePrefix: "lamda-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
            Effect: "Allow",
            Sid: "",
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, "basic-execution-role-attachment", {
      policyArn:
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      role: role.name,
    });

    const lambdaFunction = new LambdaFunction(this, "lambda", {
      functionName: `${id}-lambda`,
      s3Bucket: bucket.bucket,
      s3Key: code.key,
      handler: "index.handler",
      runtime: "nodejs18.x",
      role: role.arn,
      timeout: props.timeout ?? 30,
      memorySize: props.memorySize ?? 256,
      sourceCodeHash: asset.assetHash,
      environment: {
        variables: {
          NODE_OPTIONS: "--enable-source-maps",
          ...props.environment,
        },
      },
    });

    new LambdaFunctionEventInvokeConfig(this, "lambda-event-invoke-config", {
      functionName: lambdaFunction.functionName,
      maximumRetryAttempts: 0,
    });

    const logGroup = new CloudwatchLogGroup(this, "log-group", {
      name: `/aws/lambda/${lambdaFunction.functionName}`,
      retentionInDays: 14,
    });

    new CloudwatchQueryDefinition(this, "error-query", {
      name: `${lambdaFunction.functionName}-error-query`,
      queryString: `fields @timestamp, @message
| filter level="ERROR"
| sort @timestamp desc
| limit 25`,
      logGroupNames: [logGroup.name],
    });

    this.lambdaFunction = lambdaFunction;
    this.logGroup = logGroup;
    this.role = role;
  }
}
