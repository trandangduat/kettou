export type PrefixSumMatrix = number[][];

export type CreatePrefixSumMatrixParams = {
    boardWidth: number;
    boardHeight: number;
    sourceMatrix: number[][];
};

export const createPrefixSumMatrix = ({
    boardWidth,
    boardHeight,
    sourceMatrix,
}: CreatePrefixSumMatrixParams): PrefixSumMatrix => {
    const prefixSumMatrix: PrefixSumMatrix = Array.from(
        { length: boardHeight + 2 },
        () => Array(boardWidth + 2).fill(0),
    );

    for (let row = 0; row <= boardHeight + 1; row++) {
        for (let col = 0; col <= boardWidth + 1; col++) {
            prefixSumMatrix[row][col] +=
                row > 0 ? prefixSumMatrix[row - 1][col] : 0;
            prefixSumMatrix[row][col] +=
                col > 0 ? prefixSumMatrix[row][col - 1] : 0;
            prefixSumMatrix[row][col] -=
                row > 0 && col > 0 ? prefixSumMatrix[row - 1][col - 1] : 0;
            prefixSumMatrix[row][col] += sourceMatrix[row][col];
        }
    }

    return prefixSumMatrix;
};

export type GetRectangleSumParams = {
    prefixSumMatrix: PrefixSumMatrix;
    topRow: number;
    leftCol: number;
    bottomRow: number;
    rightCol: number;
};

export const getRectangleSum = ({
    prefixSumMatrix,
    topRow,
    leftCol,
    bottomRow,
    rightCol,
}: GetRectangleSumParams): number => {
    let result = prefixSumMatrix[bottomRow][rightCol];
    result -= topRow > 0 ? prefixSumMatrix[topRow - 1][rightCol] : 0;
    result -= leftCol > 0 ? prefixSumMatrix[bottomRow][leftCol - 1] : 0;
    result +=
        topRow > 0 && leftCol > 0
            ? prefixSumMatrix[topRow - 1][leftCol - 1]
            : 0;

    return result;
};

export type IsValidSquareMoveParams = {
    boardWidth: number;
    boardHeight: number;
    row: number;
    col: number;
    squareSize: number;
    occupiedCellsPrefixSum: PrefixSumMatrix;
    ownCellsPrefixSum: PrefixSumMatrix;
};

export const isValidSquareMove = ({
    boardWidth,
    boardHeight,
    row,
    col,
    squareSize,
    occupiedCellsPrefixSum,
    ownCellsPrefixSum,
}: IsValidSquareMoveParams): boolean => {
    // The square must fit inside the playable board.
    if (
        row + squareSize - 1 > boardHeight ||
        col + squareSize - 1 > boardWidth
    )
        return false;

    // The square cannot overlap any occupied cell.
    if (
        getRectangleSum({
            topRow: row,
            leftCol: col,
            bottomRow: row + squareSize - 1,
            rightCol: col + squareSize - 1,
            prefixSumMatrix: occupiedCellsPrefixSum,
        }) > 0
    )
        return false;

    // The square must touch one of the player's existing edges.
    return (
        getRectangleSum({
            topRow: row,
            leftCol: col - 1,
            bottomRow: row + squareSize - 1,
            rightCol: col - 1,
            prefixSumMatrix: ownCellsPrefixSum,
        }) > 0 ||
        getRectangleSum({
            topRow: row - 1,
            leftCol: col,
            bottomRow: row - 1,
            rightCol: col + squareSize - 1,
            prefixSumMatrix: ownCellsPrefixSum,
        }) > 0 ||
        getRectangleSum({
            topRow: row,
            leftCol: col + squareSize,
            bottomRow: row + squareSize - 1,
            rightCol: col + squareSize,
            prefixSumMatrix: ownCellsPrefixSum,
        }) > 0 ||
        getRectangleSum({
            topRow: row + squareSize,
            leftCol: col,
            bottomRow: row + squareSize,
            rightCol: col + squareSize - 1,
            prefixSumMatrix: ownCellsPrefixSum,
        }) > 0
    );
};
