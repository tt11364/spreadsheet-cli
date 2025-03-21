const normalizeModel = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, "");
};

export { normalizeModel };
