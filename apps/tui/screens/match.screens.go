package screens

import (
	"kettou/services"
	"kettou/theme"
	"kettou/types"
	"log"
	"strconv"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

type MatchScreen struct {
	match        types.Match
	currentUser  types.User
	isPlaying    bool
	isEnded      bool
	myTurn       bool
	myDiceNumber int
	isAWinner    bool
	playerPoints map[string]int
}

func InitMatchScreen(matchId string, currentUser types.User) MatchScreen {
	return MatchScreen{
		match: types.Match{
			Id: matchId,
		},
		currentUser: currentUser,
	}
}

func updateMatchScreen(s MatchScreen, match types.Match) MatchScreen {
	s.match = match
	s.isPlaying = s.match.Status == types.MatchStatusPlaying
	s.isEnded = s.match.Status == types.MatchStatusEnded
	s.myTurn = false
	s.myDiceNumber = 0
	s.isAWinner = false
	if s.isPlaying {
		s.myTurn = s.currentUser.Id == s.match.Players[s.match.Turn].UserId
	}
	if s.myTurn && s.match.RoundNumber > 0 && len(s.match.Rounds) == s.match.RoundNumber {
		s.myDiceNumber = s.match.Rounds[s.match.RoundNumber-1].DiceNumber
	}
	if s.isEnded {
		s.playerPoints = s.match.EndState.PlayerPoints
		s.isAWinner = s.currentUser.Id == s.match.EndState.WinnerUserId
	}
	log.Printf("---@UPDATE: %+v", s)
	return s
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

	return tea.Batch(cmds...)
}

func (s MatchScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	var cmd tea.Cmd
	switch msg := msg.(type) {
	case tea.KeyPressMsg:
		switch msg.String() {
		case "s":
			if s.currentUser.Id == s.match.Players[0].UserId {
				cmd = services.EmitEventCmd(
					"match:start",
					types.EmitMatchAction{
						MatchId: s.match.Id,
						UserId:  s.currentUser.Id,
					},
				)
				cmds = append(cmds, cmd)
			}
		case "r":
			if s.myTurn && s.myDiceNumber == 0 {
				log.Print("what the hell")
				cmd = services.EmitEventCmd(
					"match:roll-dice",
					types.EmitMatchAction{
						MatchId: s.match.Id,
						UserId:  s.currentUser.Id,
					},
				)
				cmds = append(cmds, cmd)
			}
		case "ctrl+p":
			cmd = services.EmitEventCmd(
				"match:leave",
				types.EmitMatchLeave{
					MatchId: s.match.Id,
					User: map[string]string{
						"id":       s.currentUser.Id,
						"username": s.currentUser.Username,
					},
				},
			)
			cmds = append(cmds, cmd)
			cmd = func() tea.Msg {
				return types.PopScreenMsg{}
			}
			cmds = append(cmds, cmd)
			return s, tea.Batch(cmds...)
		}
	case types.SocketEventMsg:
		switch msg.Event {
		case "match:updated":
			s = updateMatchScreen(s, msg.Data.(types.Match))
		}
	}
	return s, tea.Batch(cmds...)
}

func GameBoard(R int, C int) string {
	cell := lipgloss.NewStyle().Foreground(lipgloss.Color("#1c1c1c"))

	renderedRows := make([]string, R)

	for r := range R {
		renderedCells := make([]string, C+1)
		renderedCells[0] = string('a'+r) + " "

		for c := range C {
			renderedCells[c+1] = cell.Render("██")
		}

		renderedRows[r] = lipgloss.JoinHorizontal(
			lipgloss.Top,
			renderedCells...,
		)
	}

	numberedRows := make([]string, C+1)
	numberedRows[0] = "  "
	for c := range C {
		numberedRows[c+1] = strconv.Itoa(c) + " "
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
			)

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
		}
	} else {
		footer = "It is your opponent's turn!"
	}

	finalView := lipgloss.JoinVertical(
		lipgloss.Left,
		header,
		GameBoard(8, 8),
		footer,
	)

	return tea.NewView(finalView)
}
