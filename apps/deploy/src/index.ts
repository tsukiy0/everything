import { App } from "cdktf";
import { z } from "zod";

import { TestStack } from "./TestStack";

const Environment = z.object({
  TERRAFORM_ORGANIZATION: z.string(),
  TERRAFORM_WORKSPACE: z.string(),
  CLOUDFLARE_API_TOKEN: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
});

const env = Environment.parse(process.env);

const app = new App({});

new TestStack(app, "test", {
  terraform: {
    organization: env.TERRAFORM_ORGANIZATION,
    workspace: env.TERRAFORM_WORKSPACE,
  },
});

app.synth();
