package screens

import (
	"kettou/services"
	"kettou/types"
	"log"
	"strings"

	tea "charm.land/bubbletea/v2"
)

type GameLobbyScreen struct {
	gameId      string
	roomIds     []string
	focusedRoom int
}

func InitGameLobbyScreen(gameId string) GameLobbyScreen {
	return GameLobbyScreen{
		roomIds:     []string{},
		gameId:      gameId,
		focusedRoom: 0,
	}
}

func (s GameLobbyScreen) Init() tea.Cmd {
	return services.EmitEventCmd("lobby:rooms-update", types.EmitLobbyJoin{GameId: s.gameId})
}

func (s GameLobbyScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	var cmd tea.Cmd
	numRooms := len(s.roomIds)
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "up", "k":
			s.focusedRoom = (s.focusedRoom - 1 + numRooms) % numRooms
		case "down", "j":
			s.focusedRoom = (s.focusedRoom + 1) % numRooms
		case "ctrl+p":
			cmd = func() tea.Msg {
				return types.ChangeScreenMsg(InitCasualScreen())
			}
			cmds = append(cmds, cmd)
		}
	case types.SocketEventMsg:
		switch msg.Event {
		case "lobby:rooms-update":
			log.Printf("test lobby:rooms-update: %v\n", msg.Data)
			res, ok := msg.Data.(types.LobbyUpdate)
			if ok {
				s.roomIds = res.RoomsId
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
	for i, roomId := range s.roomIds {
		if i == s.focusedRoom {
			str.WriteString("> ")
		} else {
			str.WriteString("  ")
		}
		str.WriteString(roomId)
		str.WriteRune('\n')
	}
	return tea.NewView(str.String())
}
