export const calculateAverage = (ratings: any[]) => {
  if (!ratings.length) return 0;
  const total = ratings.reduce((sum, r) => sum + r.rating, 0);
  return Math.round((total / ratings.length) * 10) / 10;
};
