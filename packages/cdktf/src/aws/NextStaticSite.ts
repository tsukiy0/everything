import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketAcl } from "@cdktf/provider-aws/lib/s3-bucket-acl";
import { S3BucketWebsiteConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-website-configuration";
import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";
import { Construct } from "constructs";

export class NextStaticSite extends Construct {
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

    const bucket = new S3Bucket(this, "bucket", {
      bucketPrefix: `static-site-${id}`,
      forceDestroy: true,
    });

    new S3BucketAcl(this, "bucket-acl", {
      bucket: bucket.id,
      acl: "private",
    });

    new S3BucketWebsiteConfiguration(this, "bucket-website-configuration", {
      bucket: bucket.id,
      //   indexDocument: { suffix: "index.html" },
      //   errorDocument: { key: "index.html" },
    });

    new CloudfrontDistribution(this, "cloudfront-distribution", {
      origin: [
        {
          originId: "s3",
          domainName: bucket.bucketRegionalDomainName,
        },
      ],
      enabled: true,
      defaultCacheBehavior: {
        targetOriginId: "s3",
        viewerProtocolPolicy: "allow-all",
        allowedMethods: ["HEAD", "GET", "OPTIONS"],
        cachedMethods: [],
        minTtl: 0,
        defaultTtl: 0,
        maxTtl: 0,
      },
      orderedCacheBehavior: [
        {
          targetOriginId: "s3",
          pathPattern: "/_next/static/*",
          allowedMethods: ["GET", "HEAD", "OPTIONS"],
          cachedMethods: ["GET", "HEAD", "OPTIONS"],
          viewerProtocolPolicy: "allow-all",
          minTtl: 0,
          defaultTtl: 86400,
          maxTtl: 31536000,
          compress: true,
        },
      ],
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: "none",
          locations: [],
        },
      },
    });
  }
}
