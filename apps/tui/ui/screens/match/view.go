package match

import (
	"kettou/types"
	. "kettou/ui/screens/match/games-logic"
	"kettou/ui/theme"
	"strconv"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

func GameBoard(R int, C int, s MatchScreen) string {
	emptyCellStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#1c1c1c"))
	enemyCellStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#808080"))
	myCellStyle := lipgloss.NewStyle().Foreground(theme.ColorPrimary)

	renderedRows := make([]string, R)

	for r := 1; r <= R; r++ {
		renderedCells := make([]string, C+1)
		renderedCells[0] = string('a'+r-1) + " "

		for c := 1; c <= C; c++ {
			switch s.board[r][c] {
			case 1:
				renderedCells[c] = myCellStyle.Render("██")
			case 2:
				renderedCells[c] = enemyCellStyle.Render("██")
			default:
				renderedCells[c] = emptyCellStyle.Render("██")
			}
		}

		renderedRows[R-r] = lipgloss.JoinHorizontal(
			lipgloss.Top,
			renderedCells...,
		)
	}

	numberedRows := make([]string, C+1)
	numberedRows[0] = "  "
	for c := 1; c <= C; c++ {
		numberedRows[c] = strconv.Itoa(c) + " "
	}

	return lipgloss.JoinVertical(
		lipgloss.Left,
		lipgloss.JoinHorizontal(
			lipgloss.Top,
			numberedRows...,
		),
		lipgloss.JoinVertical(
			lipgloss.Left,
			renderedRows...,
		),
	)
}

func (s MatchScreen) View() tea.View {
	header := lipgloss.JoinVertical(
		lipgloss.Left,
		theme.TextBold.Render(s.match.Id),
		theme.TextBold.Render(s.match.GameID),
	)

	for i := range s.match.Players {
		header = lipgloss.JoinVertical(
			lipgloss.Left,
			header,
			"Player "+strconv.Itoa(i+1)+": "+s.match.Players[i].Username,
		)
	}

	header = lipgloss.JoinVertical(
		lipgloss.Left,
		header,
		"isPlaying: "+strconv.FormatBool(s.isPlaying),
	)

	var footer string

	if s.match.Status == types.MatchStatusReady && s.currentUser.Id == s.match.Players[0].UserId {
		keyStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color("#0087ff")).
			Bold(true).
			Render("[s]")
		startText := "You are the host. Press " + keyStyle + " to start the game"
		footer = lipgloss.JoinVertical(
			lipgloss.Left,
			startText,
		)
	}

	if s.myTurn {
		switch s.myDiceNumber > 0 {
		case false:
			keyStyle := lipgloss.NewStyle().
				Foreground(lipgloss.Color("#0087ff")).
				Bold(true).
				Render("[r]")
			turnText := "It's your turn. Press " + keyStyle + " to roll the dice"
			footer = lipgloss.JoinVertical(
				lipgloss.Left,
				turnText,
			)
		case true:
			diceStyle := lipgloss.NewStyle().
				Foreground(lipgloss.Color("#ff00ff")).
				Bold(true).
				Render(strconv.Itoa(s.myDiceNumber))
			turnText := "Your dice landed on: " + diceStyle
			guideText := "Type the coordinates to place your piece: "
			footer = lipgloss.JoinVertical(
				lipgloss.Left,
				turnText,
				guideText,
				s.moveInput.View(),
			)
		}
	} else {
		footer = "It is your opponent's turn!"
	}

	finalView := lipgloss.JoinVertical(
		lipgloss.Left,
		header,
		GameBoard(BOARD_ROWS, BOARD_COLS, s),
		footer,
	)

	return tea.NewView(finalView)
}
