import { Callback, Context, SQSEvent, SQSRecord } from "aws-lambda";
import { z } from "zod";

import { SqsQueueHandlerBuilder } from "./SqsQueueHandlerBuilder";

describe("SqsQueueHandlerBuilder", () => {
  it("throws when no message handler provided", () => {
    expect(() => {
      new SqsQueueHandlerBuilder().build();
    }).toThrowError("message handler is required");
  });

  it("throws when no handler provided", () => {
    expect(() => {
      new SqsQueueHandlerBuilder<string>()
        .withMessage(async (raw) => {
          return z.string().parse(raw);
        })
        .build();
    }).toThrowError("handler is required");
  });

  it("calls message handler and handler", async () => {
    // arrange
    let messageHandlerFn = jest
      .fn()
      .mockImplementation(async (raw: unknown) => {
        return z.string().parse(raw);
      });
    let handlerFn = jest.fn();
    const sqsQueueHandler = new SqsQueueHandlerBuilder<string>()
      .withMessage(messageHandlerFn)
      .withHandler(handlerFn)
      .build();

    // act
    await sqsQueueHandler(
      buildSqsEvent(["foo"]),
      {} as Context,
      (() => {}) as Callback
    );

    // assert
    expect(messageHandlerFn).toBeCalledTimes(1);
    expect(handlerFn).toBeCalledTimes(1);

    expect(messageHandlerFn).toBeCalledWith("foo");
    expect(handlerFn).toBeCalledWith("foo");
  });

  it("calls handlers for each message", async () => {
    // arrange
    let messageHandlerFn = jest
      .fn()
      .mockImplementation(async (raw: unknown) => {
        return z.string().parse(raw);
      });
    let handlerFn = jest.fn();
    const sqsQueueHandler = new SqsQueueHandlerBuilder<string>()
      .withMessage(messageHandlerFn)
      .withHandler(handlerFn)
      .build();

    // act
    await sqsQueueHandler(
      buildSqsEvent(["foo", "bar"]),
      {} as Context,
      (() => {}) as Callback
    );

    // assert
    expect(messageHandlerFn).toBeCalledTimes(2);
    expect(handlerFn).toBeCalledTimes(2);

    expect(messageHandlerFn).toBeCalledWith("foo");
    expect(handlerFn).toBeCalledWith("foo");

    expect(messageHandlerFn).toBeCalledWith("bar");
    expect(handlerFn).toBeCalledWith("bar");
  });
});

const buildSqsEvent = <T>(messages: T[]): SQSEvent => {
  return {
    Records: messages.map((m) => {
      return {
        body: JSON.stringify({
          data: m,
        }),
      } as SQSRecord;
    }),
  };
};
