package services

import (
	"encoding/json"
	"kettou/types"
	"log"

	tea "charm.land/bubbletea/v2"
	"github.com/zishang520/socket.io/clients/socket/v3"
)

var SocketChan = make(chan tea.Msg)
var activeClient *socket.Socket

func ConnectSocket() {
	opts := socket.DefaultOptions()
	client, err := socket.Io("http://localhost:3000", opts)
	if err != nil {
		log.Printf("failed to connect to socket: %v\n", err)
		return
	}

	activeClient = client

	client.On("connect", func(...any) {
		SocketChan <- types.SocketEventMsg{Event: "connect"}
	})

	client.On("lobby:rooms-update", func(data ...any) {
		if len(data) == 0 {
			return
		}
		SocketChan <- types.SocketEventMsg{
			Event: "lobby:rooms-update",
			Data:  handleSocketEventData[types.LobbyUpdate](data[0]),
		}
	})

	client.On("room:create", func(data ...any) {
		if len(data) == 0 {
			return
		}
		SocketChan <- types.SocketEventMsg{
			Event: "room:create",
			Data:  handleSocketEventData[types.RoomCreate](data[0]),
		}
	})

	client.On("room:leave", func(data ...any) {
		if len(data) == 0 {
			return
		}
		SocketChan <- types.SocketEventMsg{
			Event: "room:leave",
			Data:  handleSocketEventData[types.RoomLeave](data[0]),
		}
	})
}

func handleSocketEventData[T any](data any) T {
	var result T
	bytes, err := json.Marshal(data)
	if err != nil {
		return result
	}
	err = json.Unmarshal(bytes, &result)
	if err != nil {
		return result
	}
	return result
}

func WaitForSocketMsg() tea.Cmd {
	log.Print("===========WAITING FOR SOCKET MSG=============")
	return func() tea.Msg {
		return <-SocketChan
	}
}

func EmitEventCmd(event string, data any) tea.Cmd {
	return func() tea.Msg {
		if activeClient == nil {
			return nil
		}
		log.Print("EMIT: ", event, data)
		activeClient.Emit(event, data)
		return nil
	}
}
