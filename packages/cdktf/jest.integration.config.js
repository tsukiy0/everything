module.exports = {
  ...require("@tsukiy0/jest-config"),
  testMatch: ["**/*.integration.ts"],
  testTimeout: 30000,
};
