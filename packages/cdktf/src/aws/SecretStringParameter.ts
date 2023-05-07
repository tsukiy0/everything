import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";
import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";
import { Construct } from "constructs";

export class SecretStringParameter extends Construct {
  private ssmParameter: SsmParameter;

  public constructor(
    scope: Construct,
    id: string,
    props: {
      name: string;
      value: string;
    }
  ) {
    super(scope, id);

    this.ssmParameter = new SsmParameter(this, "ssm-parameter", {
      name: props.name,
      value: props.value,
      type: "SecureString",
    });
  }

  grantRead = (role: IamRole) => {
    new IamRolePolicy(this, "ssm-parameter-read", {
      role: role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["ssm:GetParameter"],
            Resource: [this.ssmParameter.arn],
          },
        ],
      }),
    });
  };
}
