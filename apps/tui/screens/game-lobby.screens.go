package screens

import (
	"kettou/services"
	"kettou/types"
	"strings"

	tea "charm.land/bubbletea/v2"
)

type GameLobbyScreen struct {
	gameId      string
	roomIds     []string
	focusedRoom int
	currentUser types.User
}

func InitGameLobbyScreen(cu types.User, gameId string) GameLobbyScreen {
	return GameLobbyScreen{
		roomIds:     []string{},
		gameId:      gameId,
		focusedRoom: 0,
		currentUser: cu,
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
			if numRooms > 0 {
				s.focusedRoom = (s.focusedRoom - 1 + numRooms) % numRooms
			}
		case "down", "j":
			if numRooms > 0 {
				s.focusedRoom = (s.focusedRoom + 1) % numRooms
			}
		case "enter":
			if numRooms > 0 {
				cmd = func() tea.Msg {
					return types.PushScreenMsg(InitMatchScreen(
						s.roomIds[s.focusedRoom],
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
		case "lobby:rooms-update":
			res, ok := msg.Data.(types.LobbyUpdate)
			if ok {
				s.roomIds = res.RoomsId
			}
		case "room:create":
			res, ok := msg.Data.(types.RoomCreate)
			if ok {
				s.roomIds = append(s.roomIds, res.RoomId)
				s.focusedRoom = 0
			}
		case "room:leave":
			res, ok := msg.Data.(types.RoomLeave)
			var newRoomIds []string
			if ok {
				for _, roomId := range s.roomIds {
					if roomId != res.RoomId {
						newRoomIds = append(newRoomIds, roomId)
					}
				}
				s.roomIds = newRoomIds
				s.focusedRoom = 0
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
