import { AcmCertificate } from "@cdktf/provider-aws/lib/acm-certificate";
import { AcmCertificateValidation } from "@cdktf/provider-aws/lib/acm-certificate-validation";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Record } from "@cdktf/provider-cloudflare/lib/record";
import { Construct } from "constructs";

export class AcmCertificateForCloudflare extends Construct {
  public readonly acmCertificateValidation: AcmCertificateValidation;

  public constructor(
    scope: Construct,
    id: string,
    props: {
      domainName: string;
      cloudflareZoneId: string;
      awsRegion?: string | "us-east-1";
    }
  ) {
    super(scope, id);

    const awsProvider = new AwsProvider(this, "aws", {
      region: props.awsRegion,
    });

    const certificate = new AcmCertificate(this, "acm-certificate", {
      domainName: props.domainName,
      validationMethod: "DNS",
      provider: awsProvider,
    });

    const record = new Record(this, "record", {
      zoneId: props.cloudflareZoneId,
      name: "${each.value.name}",
      type: "${each.value.type}",
      value: "${each.value.value}",
      proxied: false,
      allowOverwrite: true,
      ttl: 60,
    });
    record.addOverride(
      "for_each",
      `\${{
        for dvo in aws_acm_certificate.${certificate.friendlyUniqueId}.domain_validation_options : dvo.domain_name => {
          name  = dvo.resource_record_name
          type  = dvo.resource_record_type
          value = dvo.resource_record_value
        }
      }}`
    );

    const acmCertificateValidation = new AcmCertificateValidation(
      this,
      "acm-certificate-validation",
      {
        certificateArn: certificate.arn,
        provider: awsProvider,
      }
    );

    this.acmCertificateValidation = acmCertificateValidation;
  }
}
