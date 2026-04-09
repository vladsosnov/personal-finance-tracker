export const countQueryDepth = (query: string): number => {
  let max = 0;
  let current = 0;
  let inString = false;
  let escaped = false;

  for (const char of query) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") {
      current++;
      if (current > max) max = current;
    } else if (char === "}") {
      current--;
    }
  }
  return max;
};
