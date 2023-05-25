import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { Construct } from "constructs";

export class NextStaticSite extends Construct {
  bucket: S3Bucket;

  public constructor(scope: Construct, id: string, props: {}) {
    super(scope, id);

    const bucket = new S3Bucket(this, "bucket", {
      bucketPrefix: `static-site-${id}`,
      forceDestroy: true,
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
        cachedMethods: ["HEAD", "GET", "OPTIONS"],
        forwardedValues: {
          queryString: true,
          cookies: {
            forward: "none",
          },
        },
        minTtl: 0,
        defaultTtl: 0,
        maxTtl: 0,
      },
      // orderedCacheBehavior: [
      //   {
      //     targetOriginId: "s3",
      //     pathPattern: "/_next/static/*",
      //     allowedMethods: ["GET", "HEAD", "OPTIONS"],
      //     cachedMethods: ["GET", "HEAD", "OPTIONS"],
      //     viewerProtocolPolicy: "allow-all",
      //     minTtl: 0,
      //     defaultTtl: 86400,
      //     maxTtl: 31536000,
      //     compress: true,
      //   },
      // ],
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
