import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { Construct } from "constructs";

export class NextStaticSite extends Construct {
  bucket: S3Bucket;

  public constructor(scope: Construct, id: string, props: {}) {
    super(scope, id);

    const bucket = new S3Bucket(this, "bucket", {
      bucketPrefix: `static-site-${id}`,
      forceDestroy: true,
    });

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

    new CloudfrontDistribution(this, "cloudfront-distribution", {
      origin: [
        {
          originId: "s3",
          domainName: bucket.bucketRegionalDomainName,
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
    });

    this.bucket = bucket;
  }
}
