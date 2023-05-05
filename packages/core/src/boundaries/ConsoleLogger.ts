import { Logger } from "./Logger";

type LogEvent = {
  message: string;
  level: "INFO" | "ERROR";
  context: any;
};

type ErrorLogEvent = LogEvent & {
  level: "ERROR";
  stack?: string;
};

export class ConsoleLogger implements Logger {
  info = (message: string, context: any): void => {
    const event: LogEvent = {
      message,
      level: "INFO",
      context,
    };

    console.log(JSON.stringify(event));
  };

  error = (maybeError: unknown, context: any): void => {
    const error =
      maybeError instanceof Error ? maybeError : new Error(String(maybeError));

    const event: ErrorLogEvent = {
      message: error.message,
      level: "ERROR",
      stack: error.stack,
      context,
    };

    console.log(JSON.stringify(event));
  };
}
