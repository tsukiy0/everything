import { AcmCertificateValidation } from "@cdktf/provider-aws/lib/acm-certificate-validation";
import { CognitoUserPool as AwsCognitoUserPool } from "@cdktf/provider-aws/lib/cognito-user-pool";
import { CognitoUserPoolClient } from "@cdktf/provider-aws/lib/cognito-user-pool-client";
import { CognitoUserPoolDomain } from "@cdktf/provider-aws/lib/cognito-user-pool-domain";
import { Construct } from "constructs";

export class CognitoUserPool extends Construct {
  userPool: AwsCognitoUserPool;
  userPoolClient: CognitoUserPoolClient;

  public constructor(
    scope: Construct,
    id: string,
    props: {
      callbackUrls: string[];
    }
  ) {
    super(scope, id);

    const userPool = new AwsCognitoUserPool(this, "user-pool", {
      name: `${id}-user-pool`,
      aliasAttributes: ["email"],
      autoVerifiedAttributes: ["email"],
      adminCreateUserConfig: {
        allowAdminCreateUserOnly: false,
      },
    });

    new CognitoUserPoolClient(this, "user-pool-client", {
      name: `${id}-user-pool-client`,
      userPoolId: userPool.id,
      allowedOauthFlows: ["code"],
      callbackUrls: props.callbackUrls,
    });

    this.userPool = userPool;
    this.userPoolClient = this.userPoolClient;
  }

  withCustomDomain = (props: {
    domainName: string;
    acmCertificateValidation: AcmCertificateValidation;
  }) => {
    new CognitoUserPoolDomain(this, "user-pool-domain", {
      userPoolId: this.userPool.id,
      domain: props.domainName,
      certificateArn: props.acmCertificateValidation.certificateArn,
    });
  };
}
