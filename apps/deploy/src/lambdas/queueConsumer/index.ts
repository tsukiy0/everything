import { ConsoleLogger } from "@tsukiy0/core";
import { SqsQueueHandlerBuilder } from "@tsukiy0/core-aws";
import { z } from "zod";

export const handler = new SqsQueueHandlerBuilder<string>()
  .withMessage(async (raw) => {
    return z.string().parse(raw);
  })
  .withHandler(async (message) => {
    const logger = new ConsoleLogger();
    logger.info(message, {});
  })
  .build();
