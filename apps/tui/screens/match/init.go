package match

import (
	"kettou/services"
	"kettou/types"

	"charm.land/bubbles/v2/textinput"
	tea "charm.land/bubbletea/v2"
)

const BOARD_ROWS = 8
const BOARD_COLS = 8

type MatchScreen struct {
	match        types.Match
	currentUser  types.User
	isPlaying    bool
	isEnded      bool
	myTurn       bool
	myDiceNumber int
	isAWinner    bool
	board        [BOARD_ROWS + 2][BOARD_COLS + 2]int
	playerPoints map[string]int
	moveInput    textinput.Model
}

func InitMatchScreen(matchId string, currentUser types.User) MatchScreen {
	ti := textinput.New()
	ti.Placeholder = "Enter move (e.g. a1 b2)"
	ti.SetWidth(30)
	ti.CharLimit = 2
	ti.Focus()

	return MatchScreen{
		match: types.Match{
			Id: matchId,
		},
		currentUser: currentUser,
		moveInput:   ti,
	}
}

func (s MatchScreen) Init() tea.Cmd {
	var cmds []tea.Cmd
	var cmd tea.Cmd

	cmd = services.EmitEventCmd("match:join", types.EmitMatchJoin{
		MatchId: s.match.Id,
		User: map[string]string{
			"id":       s.currentUser.Id,
			"username": s.currentUser.Username,
		},
	})
	cmds = append(cmds, cmd)
	cmds = append(cmds, textinput.Blink)

	return tea.Batch(cmds...)
}
