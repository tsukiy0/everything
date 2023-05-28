import { AcmCertificateValidation } from "@cdktf/provider-aws/lib/acm-certificate-validation";
import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketWebsiteConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-website-configuration";
import { Construct } from "constructs";

export class NextStaticSite extends Construct {
  bucket: S3Bucket;
  distribution: CloudfrontDistribution;

  public constructor(scope: Construct, id: string, props: {}) {
    super(scope, id);

    const bucket = new S3Bucket(this, "bucket", {
      bucketPrefix: `static-site-${id}`,
      forceDestroy: true,
    });

    const bucketWebsiteConfiguration = new S3BucketWebsiteConfiguration(
      this,
      "bucket-website-configuration",
      {
        bucket: bucket.id,
        indexDocument: {
          suffix: "index.html",
        },
        errorDocument: {
          key: "index.html",
        },
      }
    );

    new S3BucketPublicAccessBlock(this, "bucket-public-access-block", {
      bucket: bucket.id,
      blockPublicPolicy: false,
    });

    const bucketAccessPolicy = new DataAwsIamPolicyDocument(
      this,
      "bucket-policy-document",
      {
        statement: [
          {
            principals: [
              {
                type: "*",
                identifiers: ["*"],
              },
            ],
            actions: ["s3:GetObject"],
            resources: [`${bucket.arn}/*`],
          },
        ],
      }
    );

    new S3BucketPolicy(this, "bucket-policy", {
      bucket: bucket.id,
      policy: bucketAccessPolicy.json,
    });

    // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html
    const managedCachePolicies = {
      CACHING_DISABLED: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
      CACHING_OPTIMIZED: "658327ea-f89d-4fab-a63d-7e88639e58f6",
    };

    const distribution = new CloudfrontDistribution(
      this,
      "cloudfront-distribution",
      {
        origin: [
          {
            originId: "s3",
            domainName: bucketWebsiteConfiguration.websiteEndpoint,
          },
        ],
        enabled: true,
        defaultRootObject: "index.html",
        defaultCacheBehavior: {
          targetOriginId: "s3",
          viewerProtocolPolicy: "allow-all",
          allowedMethods: ["HEAD", "GET", "OPTIONS"],
          cachedMethods: ["HEAD", "GET", "OPTIONS"],
          cachePolicyId: managedCachePolicies.CACHING_DISABLED,
        },
        orderedCacheBehavior: [
          {
            targetOriginId: "s3",
            viewerProtocolPolicy: "allow-all",
            pathPattern: "/_next/static/*",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            cachePolicyId: managedCachePolicies.CACHING_OPTIMIZED,
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
      }
    );

    this.bucket = bucket;
    this.distribution = distribution;
  }

  withCustomDomain = (props: {
    domainName: string;
    acmCertificateValidation: AcmCertificateValidation;
  }) => {
    this.distribution.aliases = [props.domainName];
    this.distribution.putViewerCertificate({
      cloudfrontDefaultCertificate: false,
      acmCertificateArn: props.acmCertificateValidation.certificateArn,
      sslSupportMethod: "sni-only",
      minimumProtocolVersion: "TLSv1",
    });
  };
}
