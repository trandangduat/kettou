package gameslogic

const (
	BOARD_ROWS = 8
	BOARD_COLS = 8
	BOARD_XTRA = 2
)

type matrix[T any] [BOARD_ROWS + BOARD_XTRA][BOARD_COLS + BOARD_XTRA]T

type createPrefixSumMatrixParams struct {
	boardWidth   int
	boardHeight  int
	sourceMatrix matrix[int]
}

func createPrefixSumMatrix(p createPrefixSumMatrixParams) matrix[int] {
	var f matrix[int]

	for r := 0; r <= p.boardHeight; r++ {
		for c := 0; c <= p.boardWidth; c++ {
			if r > 0 {
				f[r][c] += f[r-1][c]
			}
			if c > 0 {
				f[r][c] += f[r][c-1]
			}
			if r > 0 && c > 0 {
				f[r][c] -= f[r-1][c-1]
			}
			f[r][c] += p.sourceMatrix[r][c]
		}
	}

	return f
}

type getRectangleSumParams struct {
	prefixSumMatrix matrix[int]
	topRow          int
	leftCol         int
	bottomRow       int
	rightCol        int
}

func getRectangleSum(p getRectangleSumParams) int {
	result := p.prefixSumMatrix[p.bottomRow][p.rightCol]
	if p.topRow > 0 {
		result -= p.prefixSumMatrix[p.topRow-1][p.rightCol]
	}
	if p.leftCol > 0 {
		result -= p.prefixSumMatrix[p.bottomRow][p.leftCol-1]
	}
	if p.topRow > 0 && p.leftCol > 0 {
		result += p.prefixSumMatrix[p.topRow-1][p.leftCol-1]
	}

	return result
}

type IsValidSquareMoveParams struct {
	boardWidth             int
	boardHeight            int
	row                    int
	col                    int
	squareSize             int
	occupiedCellsPrefixSum matrix[int]
	ownCellsPrefixSum      matrix[int]
}

func isValidSquareMove(p IsValidSquareMoveParams) bool {
	// The square must fit inside the playable board.
	if p.row+p.squareSize-1 > p.boardHeight || p.col+p.squareSize-1 > p.boardWidth {
		return false
	}

	// The square cannot overlap any occupied cell.
	if getRectangleSum(getRectangleSumParams{
		topRow:          p.row,
		leftCol:         p.col,
		bottomRow:       p.row + p.squareSize - 1,
		rightCol:        p.col + p.squareSize - 1,
		prefixSumMatrix: p.occupiedCellsPrefixSum,
	}) > 0 {
		return false
	}

	// The square must touch one of the player's existing edges.
	return getRectangleSum(getRectangleSumParams{
		topRow:          p.row,
		leftCol:         p.col - 1,
		bottomRow:       p.row + p.squareSize - 1,
		rightCol:        p.col - 1,
		prefixSumMatrix: p.ownCellsPrefixSum,
	}) > 0 ||
		getRectangleSum(getRectangleSumParams{
			topRow:          p.row - 1,
			leftCol:         p.col,
			bottomRow:       p.row - 1,
			rightCol:        p.col + p.squareSize - 1,
			prefixSumMatrix: p.ownCellsPrefixSum,
		}) > 0 ||
		getRectangleSum(getRectangleSumParams{
			topRow:          p.row,
			leftCol:         p.col + p.squareSize,
			bottomRow:       p.row + p.squareSize - 1,
			rightCol:        p.col + p.squareSize,
			prefixSumMatrix: p.ownCellsPrefixSum,
		}) > 0 ||
		getRectangleSum(getRectangleSumParams{
			topRow:          p.row + p.squareSize,
			leftCol:         p.col,
			bottomRow:       p.row + p.squareSize,
			rightCol:        p.col + p.squareSize - 1,
			prefixSumMatrix: p.ownCellsPrefixSum,
		}) > 0
}

func CalcValidMoveMatrix(board matrix[int], squareLen int) (matrix[bool], bool) {
	noValidMoves := true
	var validMoveBoard matrix[bool]
	for i := 1; i <= BOARD_ROWS; i++ {
		for j := 1; j <= BOARD_COLS; j++ {
			validMoveBoard[i][j] = false
		}
	}

	var ownCells matrix[int]
	for i := 0; i <= BOARD_ROWS; i++ {
		for j := 0; j <= BOARD_COLS; j++ {
			if board[i][j] == 1 {
				ownCells[i][j] = board[i][j]
			}
		}
	}

	occupiedCellsPrefixSum := createPrefixSumMatrix(createPrefixSumMatrixParams{
		boardWidth:   BOARD_COLS,
		boardHeight:  BOARD_ROWS,
		sourceMatrix: board,
	})
	ownCellsPrefixSum := createPrefixSumMatrix(createPrefixSumMatrixParams{
		boardWidth:   BOARD_COLS,
		boardHeight:  BOARD_ROWS,
		sourceMatrix: ownCells,
	})

	// log.Printf("%+v %+v", board, squareLen)
	// log.Printf("occupiedCellsPrefixSum %+v", occupiedCellsPrefixSum)
	// log.Printf("ownCellsPrefixSum %+v", ownCellsPrefixSum)

	for i := 1; i <= BOARD_ROWS; i++ {
		for j := 1; j <= BOARD_COLS; j++ {
			validMoveBoard[i][j] = isValidSquareMove(IsValidSquareMoveParams{
				boardWidth:             BOARD_COLS,
				boardHeight:            BOARD_ROWS,
				row:                    i,
				col:                    j,
				squareSize:             squareLen,
				occupiedCellsPrefixSum: occupiedCellsPrefixSum,
				ownCellsPrefixSum:      ownCellsPrefixSum,
			})
			if validMoveBoard[i][j] {
				noValidMoves = false
			}
		}
	}

	return validMoveBoard, noValidMoves
}
