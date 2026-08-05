import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateRating } from "./rating";

describe("calculateRating", () => {
  it("returns 0 when there are no reviews", () => {
    const result = calculateRating([]);
    assert.strictEqual(result.rating, 0);
    assert.strictEqual(result.reviewCount, 0);
  });

  it("calculates the average of multiple reviews", () => {
    const result = calculateRating([{ rating: 4 }, { rating: 5 }, { rating: 3 }]);
    assert.strictEqual(result.rating, 4);
    assert.strictEqual(result.reviewCount, 3);
  });
});
