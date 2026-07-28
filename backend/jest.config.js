/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  testMatch: ["**/__tests__/**/*.test.ts"],
  // Functional tests hit the real Express app in-process (supertest), which
  // in turn makes real calls to Firestore and the Daml JSON API - the same
  // backing services `npm run dev` uses. There is no mock layer for either,
  // so `daml start` and a valid `gcloud auth login` session must both be
  // active for these to pass, exactly like running the app normally.
  testTimeout: 30000,
  maxWorkers: 1,
};
