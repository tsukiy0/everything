import { SQSHandler } from "aws-lambda";

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
      throw new Error("message is required");
    }

    if (!this.handler) {
      throw new Error("handler is required");
    }

    const messageHandler = this.messageHandler;
    const handler = this.handler;

    const sqsHandler: SQSHandler = async (event) => {
      for (const record of event.Records) {
        const wrapper = JSON.parse(record.body);
        const raw = wrapper.data;

        const input = await messageHandler(raw);

        await handler(input);
      }
    };

    return sqsHandler;
  };
}
