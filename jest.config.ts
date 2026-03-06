import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  coverageProvider: "v8",
  collectCoverageFrom: [
    "lib/**/*.ts",
    "!lib/**/*.d.ts",
  ],
  testMatch: ["**/__tests__/**/*.test.ts"],
};

export default createJestConfig(config);
