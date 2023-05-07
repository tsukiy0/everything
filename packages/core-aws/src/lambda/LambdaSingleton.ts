export class LambdaSingleton<T> {
  private instance: T | undefined;

  constructor(private readonly create: () => Promise<T>) {}

  get = async (): Promise<T> => {
    if (this.instance) {
      return this.instance;
    }

    const instance = await this.create();
    this.instance = instance;

    return instance;
  };
}
