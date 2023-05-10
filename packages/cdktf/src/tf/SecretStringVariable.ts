import { TerraformVariable } from "cdktf";
import { Construct } from "constructs";

export class SecretStringVariable extends Construct {
  private variable: TerraformVariable;

  public constructor(scope: Construct, id: string) {
    super(scope, id);

    const variable = new TerraformVariable(this, id, {
      type: "string",
      sensitive: true,
      nullable: false,
    });
    variable.overrideLogicalId(id);

    this.variable = variable;
  }

  value = (): string => {
    return this.variable.stringValue;
  };
}
