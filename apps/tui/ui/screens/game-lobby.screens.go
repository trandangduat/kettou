package screens

import (
	"kettou/services"
	"kettou/types"
	"kettou/ui/screens/match"
	"strings"

	tea "charm.land/bubbletea/v2"
)

type GameLobbyScreen struct {
	gameId       string
	matchIds     []string
	focusedMatch int
	currentUser  types.User
}

func InitGameLobbyScreen(cu types.User, gameId string) GameLobbyScreen {
	return GameLobbyScreen{
		matchIds:     []string{},
		gameId:       gameId,
		focusedMatch: 0,
		currentUser:  cu,
	}
}

func (s GameLobbyScreen) Init() tea.Cmd {
	return services.EmitEventCmd("lobby:matches-update", types.EmitLobbyJoin{GameId: s.gameId})
}

func (s GameLobbyScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	var cmd tea.Cmd
	numMatches := len(s.matchIds)
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "up", "k":
			if numMatches > 0 {
				s.focusedMatch = (s.focusedMatch - 1 + numMatches) % numMatches
			}
		case "down", "j":
			if numMatches > 0 {
				s.focusedMatch = (s.focusedMatch + 1) % numMatches
			}
		case "enter":
			if numMatches > 0 {
				cmd = func() tea.Msg {
					return types.PushScreenMsg(match.InitMatchScreen(
						s.matchIds[s.focusedMatch],
						s.currentUser,
					))
				}
				cmds = append(cmds, cmd)
			}
		case "ctrl+p":
			cmd = func() tea.Msg {
				return types.PopScreenMsg{}
			}
			cmds = append(cmds, cmd)
		}
	case types.SocketEventMsg:
		switch msg.Event {
		case "lobby:matches-update":
			res, ok := msg.Data.(types.LobbyUpdate)
			if ok {
				s.matchIds = res.MatchIds
			}
		case "match:created":
			res, ok := msg.Data.(types.MatchCreated)
			if ok {
				s.matchIds = append(s.matchIds, res.MatchId)
				s.focusedMatch = 0
			}
		case "match:deleted":
			res, ok := msg.Data.(types.MatchDeleted)
			var newMatchIds []string
			if ok {
				for _, matchId := range s.matchIds {
					if matchId != res.MatchId {
						newMatchIds = append(newMatchIds, matchId)
					}
				}
				s.matchIds = newMatchIds
				s.focusedMatch = 0
			}
		}
	}
	return s, tea.Batch(cmds...)

}

func (s GameLobbyScreen) View() tea.View {
	var str strings.Builder
	str.WriteString("Game Lobby: ")
	str.WriteString(s.gameId)
	str.WriteRune('\n')
	for i, matchId := range s.matchIds {
		if i == s.focusedMatch {
			str.WriteString("> ")
		} else {
			str.WriteString("  ")
		}
		str.WriteString(matchId)
		str.WriteRune('\n')
	}
	return tea.NewView(str.String())
}
