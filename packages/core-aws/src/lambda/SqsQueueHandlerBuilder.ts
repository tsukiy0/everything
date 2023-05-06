import { SQSHandler } from "aws-lambda";

export class SqsQueueHandlerBuilder<TMessage> {
  private messageHandler: (raw: unknown) => Promise<TMessage>;
  private handler: (message: TMessage) => Promise<void>;

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
    const handler: SQSHandler = async (event) => {
      for (const record of event.Records) {
        const wrapper = JSON.parse(record.body);
        const raw = wrapper.data;

        const input = await this.messageHandler(raw);

        await this.handler(input);
      }
    };

    return handler;
  };
}
