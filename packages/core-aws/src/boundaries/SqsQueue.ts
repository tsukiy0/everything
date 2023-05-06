import { Queue } from "@tsukiy0/core";

export class SqsQueue<T> implements Queue<T> {
  send(message: T): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
