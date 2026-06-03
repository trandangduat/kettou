const K_FACTOR = 32;

export const getNewElo = ({
    yourRating,
    enemyRating,
    result,
    k = K_FACTOR,
}: {
    yourRating: number;
    enemyRating: number;
    result: number;
    k?: number;
}): number => {
    const expected = 1 / (1 + Math.pow(10, (enemyRating - yourRating) / 400));
    const ratingChange = k * (result - expected);
    return yourRating + ratingChange;
};
