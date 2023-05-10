import { AcmCertificateValidation } from "@cdktf/provider-aws/lib/acm-certificate-validation";
import { Apigatewayv2Api } from "@cdktf/provider-aws/lib/apigatewayv2-api";
import { Apigatewayv2ApiMapping } from "@cdktf/provider-aws/lib/apigatewayv2-api-mapping";
import { Apigatewayv2DomainName } from "@cdktf/provider-aws/lib/apigatewayv2-domain-name";
import { Apigatewayv2Integration } from "@cdktf/provider-aws/lib/apigatewayv2-integration";
import { Apigatewayv2Route } from "@cdktf/provider-aws/lib/apigatewayv2-route";
import { Apigatewayv2Stage } from "@cdktf/provider-aws/lib/apigatewayv2-stage";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";
import { Construct } from "constructs";

export class LambdaHttpApi extends Construct {
  public readonly api: Apigatewayv2Api;
  private readonly stage: Apigatewayv2Stage;

  public constructor(
    scope: Construct,
    id: string,
    private readonly props: {
      lambdaFunction: LambdaFunction;
    }
  ) {
    super(scope, id);

    const api = new Apigatewayv2Api(this, "api", {
      name: id,
      protocolType: "HTTP",
    });

    const stage = new Apigatewayv2Stage(this, "stage", {
      apiId: api.id,
      name: "$default",
      autoDeploy: true,
    });

    const integration = new Apigatewayv2Integration(this, "integration", {
      apiId: api.id,
      integrationUri: props.lambdaFunction.invokeArn,
      integrationType: "AWS_PROXY",
      integrationMethod: "POST",
    });

    new Apigatewayv2Route(this, "route", {
      apiId: api.id,
      routeKey: "$default",
      authorizationType: "NONE",
      target: `integrations/${integration.id}`,
    });

    new LambdaPermission(this, "api-lambda-permission", {
      functionName: props.lambdaFunction.functionName,
      action: "lambda:InvokeFunction",
      principal: "apigateway.amazonaws.com",
      sourceArn: `${api.executionArn}/*/*`,
    });

    this.api = api;
    this.stage = stage;
  }

  public withCustomDomain = (props: {
    domainName: string;
    acmCertificateValidation: AcmCertificateValidation;
  }): LambdaHttpApi => {
    const domainName = new Apigatewayv2DomainName(this, "domain-name", {
      domainName: props.domainName,
      domainNameConfiguration: {
        certificateArn: props.acmCertificateValidation.certificateArn,
        endpointType: "REGIONAL",
        securityPolicy: "TLS_1_2",
      },
    });

    domainName.domainNameConfiguration.targetDomainName

    new Apigatewayv2ApiMapping(this, "api-mapping", {
      apiId: this.api.id,
      stage: this.stage.id,
      domainName: domainName.id,
    });

    return this;
  };
}
