export function decycle(object: any, references: any[] = []) {
  const decycled: any = {};

  for (const key in object) {
    const value = object[key];
    if (typeof value === "object") {
      const referenceIndex = references.findIndex((reference) =>
        reference === value
      );
      if (referenceIndex === -1) {
        references.push(value);
        decycled[key] = decycle(value, references);
      } else {
        decycled[key] = `reference ${referenceIndex}`;
      }
    } else {
      decycled[key] = value;
    }
  }

  return decycled;
}
