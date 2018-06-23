import { count, toArray, takeWhile, map } from "./sequence";

test("count", () => {
  const seq = count(0);
  expect(0).toBe(0);
});

test("basic again", () => {
  expect(4).toBe(3);
});
