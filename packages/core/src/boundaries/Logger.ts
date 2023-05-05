export interface Logger {
  info(message: string, context?: any): void;
  error(error: unknown, context?: any): void;
}
