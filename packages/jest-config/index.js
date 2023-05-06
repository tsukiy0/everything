module.exports = {
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
};
