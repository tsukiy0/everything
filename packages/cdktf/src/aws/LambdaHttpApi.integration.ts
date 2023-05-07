import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

describe("LambdaHttpApi", () => {
  it("", async () => {
    // arrange
    const ssm = new SSMClient({});
    const ssmParameter = await ssm.send(
      new GetParameterCommand({
        Name: "/test/api-lambda-http-api-endpoint",
        WithDecryption: true,
      })
    );
    const baseUrl = ssmParameter.Parameter!.Value!;
    const requestUrl = new URL(baseUrl);
    requestUrl.pathname = "/v1/healthcheck";

    // act
    const got = await fetch(requestUrl);

    //assert
    expect(got.ok).toBeTruthy();
    expect(await got.text()).toEqual("OK");
  });
});
