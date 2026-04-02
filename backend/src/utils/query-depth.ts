export const countQueryDepth = (query: string): number => {
  let max = 0;
  let current = 0;
  for (const char of query) {
    if (char === "{") {
      current++;
      if (current > max) max = current;
    } else if (char === "}") {
      current--;
    }
  }
  return max;
};
