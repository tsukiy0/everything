import { Record } from "@cdktf/provider-cloudflare/lib/record";
import { Construct } from "constructs";

export class CNameDnsRecord extends Construct {
  public constructor(
    scope: Construct,
    id: string,
    props: {
      zoneId: string;
      domainName: string;
      target: string;
    }
  ) {
    super(scope, id);

    new Record(this, "record", {
      zoneId: props.zoneId,
      name: props.domainName,
      type: "CNAME",
      value: props.target,
      proxied: false,
      ttl: 60,
    });
  }
}
