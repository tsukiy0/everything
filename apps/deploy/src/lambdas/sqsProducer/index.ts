import { SqsQueue } from "@tsukiy0/core-aws";
import { Handler } from "aws-lambda";
import { z } from "zod";

const Env = z.object({
  QUEUE_URL: z.string(),
});

const env = Env.parse(process.env);

export const handler: Handler = async (request): Promise<void> => {
  const queue = SqsQueue.build<string>(env.QUEUE_URL);

  const messages = ["a", "b", "c", "d", "e"];

  await Promise.all(messages.map(async (message) => queue.send(message)));
};
