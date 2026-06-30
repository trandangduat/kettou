package match

import (
	. "kettou/screens/match/games-logic"
	"kettou/services"
	"kettou/types"

	tea "charm.land/bubbletea/v2"
)

func updateMatchScreen(s MatchScreen, match types.Match) MatchScreen {
	s.match = match
	s.isPlaying = s.match.Status == types.MatchStatusPlaying
	s.isEnded = s.match.Status == types.MatchStatusEnded
	s.myTurn = false
	s.myDiceNumber = 0
	s.isAWinner = false
	s.noValidMoves = false
	if s.match.Rounds != nil {
		// putting the square in the bottom edge of the board is always valid
		for j := 1; j <= BOARD_COLS; j++ {
			s.board[0][j] = 1
		}
		for k := range s.match.Rounds {
			round := s.match.Rounds[k]
			isYours := round.PlayerId == s.currentUser.Id
			if isYours {
				r := round.Move.R
				c := round.Move.C
				len := round.Move.Len
				for i := r; i <= r+len-1; i++ {
					for j := c; j <= c+len-1; j++ {
						s.board[i][j] = 1
					}
				}
			} else {
				r := BOARD_ROWS - round.Move.R + 1
				c := BOARD_COLS - round.Move.C + 1
				len := round.Move.Len
				for i := r; i >= r-len+1; i-- {
					for j := c; j >= c-len+1; j-- {
						s.board[i][j] = 2
					}
				}
			}
		}
	}
	if s.isPlaying {
		s.myTurn = s.currentUser.Id == s.match.Players[s.match.Turn].UserId
	}
	if s.myTurn && s.match.RoundNumber > 0 && len(s.match.Rounds) == s.match.RoundNumber {
		s.myDiceNumber = s.match.Rounds[s.match.RoundNumber-1].DiceNumber
	}
	if s.myTurn && s.myDiceNumber > 0 {
		s.validMoveBoard, s.noValidMoves = CalcValidMoveMatrix(s.board, s.myDiceNumber)
	}
	if s.isEnded {
		s.playerPoints = s.match.EndState.PlayerPoints
		s.isAWinner = s.currentUser.Id == s.match.EndState.WinnerUserId
	}
	return s
}

func (s MatchScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	var cmd tea.Cmd
	if s.myTurn && s.myDiceNumber > 0 {
		s.moveInput, cmd = s.moveInput.Update(msg)
		cmds = append(cmds, cmd)
	}
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
				cmd = services.EmitEventCmd(
					"match:roll-dice",
					types.EmitMatchAction{
						MatchId: s.match.Id,
						UserId:  s.currentUser.Id,
					},
				)
				cmds = append(cmds, cmd)
			}
		case "enter":
			if s.myTurn && s.myDiceNumber > 0 {
				moveStr := s.moveInput.Value()
				move := types.Move{
					R:   int(moveStr[0]-'a') + 1,
					C:   int(moveStr[1]-'1') + 1,
					Len: s.myDiceNumber,
				}
				if s.validMoveBoard[move.R][move.C] {
					cmd = services.EmitEventCmd(
						"match:finish-move",
						types.EmitMatchMove{
							MatchId: s.match.Id,
							UserId:  s.currentUser.Id,
							Move:    move,
						},
					)
					cmds = append(cmds, cmd)
					s.moveInput.Reset()
				}
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
			if s.noValidMoves {
				cmd = services.EmitEventCmd(
					"match:cannot-move",
					types.EmitMatchAction{
						MatchId: s.match.Id,
						UserId:  s.currentUser.Id,
					},
				)
				cmds = append(cmds, cmd)
			}
		}
	}
	return s, tea.Batch(cmds...)
}
