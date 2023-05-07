import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Queue } from "@tsukiy0/core";

export class SqsQueue<T> implements Queue<T> {
  constructor(
    private readonly sqs: SQSClient,
    private readonly queueUrl: string
  ) {}

  static build = <T>(queueUrl: string): SqsQueue<T> => {
    const client = new SQSClient({});
    return new SqsQueue(client, queueUrl);
  };

  send = async (message: T): Promise<void> => {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify({
        data: message,
      }),
    });

    await this.sqs.send(command);
  };
}
