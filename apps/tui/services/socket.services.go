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

	client.On("lobby:matches-update", func(data ...any) {
		if len(data) == 0 {
			return
		}
		SocketChan <- types.SocketEventMsg{
			Event: "lobby:matches-update",
			Data:  handleSocketEventData[types.LobbyUpdate](data[0]),
		}
	})

	client.On("match:created", func(data ...any) {
		if len(data) == 0 {
			return
		}
		SocketChan <- types.SocketEventMsg{
			Event: "match:created",
			Data:  handleSocketEventData[types.MatchCreated](data[0]),
		}
	})

	client.On("match:deleted", func(data ...any) {
		if len(data) == 0 {
			return
		}
		SocketChan <- types.SocketEventMsg{
			Event: "match:deleted",
			Data:  handleSocketEventData[types.MatchDeleted](data[0]),
		}
	})

	client.On("match:updated", func(data ...any) {
		if len(data) == 0 {
			return
		}
		SocketChan <- types.SocketEventMsg{
			Event: "match:updated",
			Data:  handleSocketEventData[types.Match](data[0]),
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
		log.Printf("--->EMIT: %s, %+v", event, data)
		activeClient.Emit(event, data)
		return nil
	}
}
