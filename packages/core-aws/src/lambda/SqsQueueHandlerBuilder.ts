import { ConsoleLogger } from "@tsukiy0/core";
import { SQSHandler, SQSRecord } from "aws-lambda";

export class SqsQueueHandlerBuilder<TMessage> {
  private messageHandler?: (raw: unknown) => Promise<TMessage>;
  private handler?: (message: TMessage) => Promise<void>;

  withMessage = (
    messageHandler: (raw: unknown) => Promise<TMessage>
  ): SqsQueueHandlerBuilder<TMessage> => {
    this.messageHandler = messageHandler;

    return this;
  };

  withHandler = (
    handler: (message: TMessage) => Promise<void>
  ): SqsQueueHandlerBuilder<TMessage> => {
    this.handler = handler;

    return this;
  };

  build = (): SQSHandler => {
    if (!this.messageHandler) {
      throw new Error("message handler is required");
    }

    if (!this.handler) {
      throw new Error("handler is required");
    }

    const messageHandler = this.messageHandler;
    const handler = this.handler;

    const sqsHandler: SQSHandler = async (event) => {
      const failures: SQSRecord[] = [];
      const logger = new ConsoleLogger();

      for (const record of event.Records) {
        try {
          const body = JSON.parse(record.body);
          const raw = body.data;

          const message = await messageHandler(raw);

          await handler(message);
        } catch (e) {
          logger.error(e, { record });
          failures.push(record);
        }
      }

      return {
        batchItemFailures: failures.map((f) => {
          return {
            itemIdentifier: f.messageId,
          };
        }),
      };
    };

    return sqsHandler;
  };
}
