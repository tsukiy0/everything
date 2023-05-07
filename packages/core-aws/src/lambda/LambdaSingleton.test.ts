import { LambdaSingleton } from "./LambdaSingleton";

describe("LambdaSingleton", () => {
  it("creates on first get", async () => {
    // arrange
    const create = jest.fn().mockResolvedValue("foo");
    const sut = new LambdaSingleton<string>(create);

    // act
    const got = await sut.get();

    // assert
    expect(got).toEqual("foo");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("uses cached value on second get", async () => {
    // arrange
    const create = jest.fn().mockResolvedValue("foo");
    const sut = new LambdaSingleton<string>(create);

    // act
    await sut.get();
    const got = await sut.get();

    // assert
    expect(got).toEqual("foo");
    expect(create).toHaveBeenCalledTimes(1);
  });
});
