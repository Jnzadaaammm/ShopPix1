interface ReviewWithRating {
  rating: number;
}

export function calculateRating<T extends ReviewWithRating>(reviews: T[]) {
  const reviewCount = reviews.length;
  const rating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;
  return { rating, reviewCount };
}

export function formatRating(value: number) {
  return Number(value.toFixed(1));
}
