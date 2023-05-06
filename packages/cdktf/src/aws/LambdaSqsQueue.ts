import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";
import { LambdaEventSourceMapping } from "@cdktf/provider-aws/lib/lambda-event-source-mapping";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { SqsQueue } from "@cdktf/provider-aws/lib/sqs-queue";
import { Construct } from "constructs";

export class LambdaSqsQueue extends Construct {
  public readonly sqsQueue: SqsQueue;

  public constructor(
    scope: Construct,
    id: string,
    props: {
      lambdaFunction: LambdaFunction;
      lambdaFunctionRole: IamRole;
      enabled: boolean;
      maxRetries: number;
      batchSize: number;
    }
  ) {
    super(scope, id);

    const deadLetterSqsQueue = new SqsQueue(this, "deadletter-sqs-queue", {
      namePrefix: `${id}-deadletter`,
    });

    const sqsQueue = new SqsQueue(this, "sqs-queue", {
      namePrefix: id,
      visibilityTimeoutSeconds: props.lambdaFunction.timeout + 30,
      redrivePolicy: JSON.stringify({
        deadLetterTargetArn: deadLetterSqsQueue.arn,
        maxReceiveCount: props.maxRetries || 1,
      }),
    });

    new IamRolePolicy(this, "lambda-sqs-policy", {
      role: props.lambdaFunctionRole.name,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "sqs:DeleteMessage",
              "sqs:GetQueueAttributes",
              "sqs:ReceiveMessage",
            ],
            Resource: sqsQueue.arn,
          },
        ],
      }),
    });

    new LambdaEventSourceMapping(this, "lambda-event-source-mapping", {
      eventSourceArn: sqsQueue.arn,
      functionName: props.lambdaFunction.arn,
      enabled: props.enabled,
      batchSize: props.batchSize,
    });

    this.sqsQueue = sqsQueue;
  }

  grantSend = (role: IamRole) => {
    new IamRolePolicy(this, "sqs-queue-send-access", {
      role: role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["sqs:SendMessage"],
            Resource: this.sqsQueue.arn,
          },
        ],
      }),
    });
  };
}
