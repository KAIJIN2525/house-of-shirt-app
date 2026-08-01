module.exports = {
  preset: "jest-expo",
  clearMocks: true,
  collectCoverageFrom: [
    "stores/**/*.{ts,tsx}",
    "services/**/*.{ts,tsx}",
    "!**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFiles: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],
};
