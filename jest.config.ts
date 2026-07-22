import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          isolatedModules: true,
        },
        useESM: false,
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  clearMocks: true,
  collectCoverageFrom: [
    "src/controllers/**/*.ts",
    "src/middleware/**/*.ts",
    "src/utils/**/*.ts",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
};

export default config;
