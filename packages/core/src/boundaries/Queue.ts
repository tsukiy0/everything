export interface Queue<T> {
  send(message: T): Promise<void>;
}
