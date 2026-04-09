const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const isValidObjectId = (id: string): boolean => OBJECT_ID_REGEX.test(id);

export const assertValidObjectId = (id: string, label = "ID") => {
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ${label}`);
  }
};
