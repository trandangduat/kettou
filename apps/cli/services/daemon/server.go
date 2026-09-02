package daemon

import (
	"fmt"
	"kettou/types"
	"net"
	"net/http"
	"os"
)

const KettoudPath = "/tmp/kettoud.sock"

type DaemonServer struct {
	currentUser *types.User
	matchState  *types.Match
}

func NewDaemonServer() *DaemonServer {
	return &DaemonServer{}
}

func StartDaemonServer() error {
	_ = os.Remove(KettoudPath)
	listener, err := net.Listen("unix", KettoudPath)
	if err != nil {
		return err
	}
	defer listener.Close()
	fmt.Println("Daemon started at ", KettoudPath)

	daemonServer := NewDaemonServer()
	daemonServer.updateCurrentUser()

	mux := http.NewServeMux()
	mux.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("daemon is running\n"))
	})

	// AUTH
	mux.HandleFunc("/login", daemonServer.handleLogin)

	// MATCH
	mux.HandleFunc("/match/create", daemonServer.handleMatchCreate)
	mux.HandleFunc("/match/join", daemonServer.handleMatchJoin)
	mux.HandleFunc("/match/start", daemonServer.handleMatchStart)
	mux.HandleFunc("/match/roll-dice", daemonServer.handleMatchRollDice)
	mux.HandleFunc("/match/move", daemonServer.handleMatchMove)
	mux.HandleFunc("/match/cannot-move", daemonServer.handleMatchCannotMove)

	return http.Serve(listener, mux)
}
