package services

import (
	"encoding/json"
	"fmt"
	"kettou/types"
	"log"
	"net/http"
	"net/url"

	"github.com/zishang520/socket.io/clients/socket/v3"
)

var SocketChan = make(chan types.SocketEventMsg)
var activeClient *socket.Socket

func DisconnectSocket() {
	if activeClient != nil {
		activeClient.Close()
		activeClient = nil
	}
}

func ConnectSocket() {
	if cookiesJar == nil {
		log.Println("cookiesJar is not initialized.")
	}

	opts := socket.DefaultOptions()
	serverUrl, _ := url.Parse("http://localhost:3000")
	headers := http.Header{}
	foundAccessToken := false
	for _, cookie := range cookiesJar.Cookies(serverUrl) {
		if cookie.Name == "accessToken" {
			headers.Add("Cookie", cookie.String())
			foundAccessToken = true
			break
		}
	}
	if !foundAccessToken {
		log.Println("accessToken not found in cookies.")
		return
	}
	opts.SetExtraHeaders(headers)

	client, err := socket.Io("http://localhost:3000", opts)
	if err != nil {
		log.Printf("failed to connect to socket: %v\n", err)
		return
	}

	if activeClient != nil {
		activeClient.Close()
	}
	activeClient = client

	client.On("match:updated", func(data ...any) {
		if len(data) == 0 {
			return
		}
		SocketChan <- types.SocketEventMsg{
			Event: "match:updated",
			Data:  convertMapToStructType[types.Match](data[0]),
		}
	})
}

func convertMapToStructType[T any](data any) T {
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

func WaitForSocket() {
	log.Printf("--->SOCKET CHAN: %+v\n", <-SocketChan)
}

func EmitEvent(event string, data any) {
	if activeClient == nil {
		return
	}
	err := activeClient.Emit(event, data)
	if err != nil {
		fmt.Print(err)
	}
	log.Printf("Event emitted: %s\n", event)
}

func EmitEventWithAck[T any](event string, data any) *T {
	var res *T = nil
	if activeClient == nil {
		return res
	}
	done := make(chan struct{})
	activeClient.EmitWithAck(event, data)(func(args []any, err error) {
		defer close(done)

		if err != nil {
			fmt.Println(err)
			return
		}

		if len(args) > 0 {
			value := convertMapToStructType[T](args[0])
			res = &value
		}
	})
	<-done

	log.Printf("Event emitted with ack: %s\n", event)
	return res
}
