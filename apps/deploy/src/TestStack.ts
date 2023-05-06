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
      codePath: path.resolve(__dirname, "../dist"),
    });
  }
}
