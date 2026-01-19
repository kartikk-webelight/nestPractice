export const totalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};
