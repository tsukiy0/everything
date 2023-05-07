import { ConsoleLogger } from "@tsukiy0/core";
import { Handler } from "aws-lambda";

export const handler: Handler = async (request): Promise<void> => {
  const logger = new ConsoleLogger();

  logger.info("request", {
    request,
  });

  logger.error("test error", {
    request,
  });
};
