import { normalizeSearchQuery } from "./search";

const samples = [
  { input: "  OpenAI,,,, GPT-5 ", expected: "OpenAI GPT-5" },
  { input: "%weird_query(_)", expected: "weird query" },
  { input: "", expected: "" },
];

samples.forEach(({ input, expected }) => {
  const result = normalizeSearchQuery(input);
  console.log(`Input: "${input}" => "${result}"`);
  if (result !== expected) {
    throw new Error(`normalizeSearchQuery failed for "${input}" (received "${result}")`);
  }
});

console.log("All normalizeSearchQuery samples passed ✔️");
