package daemon

import (
	"encoding/json"
	"fmt"
	"kettou/services"
	"kettou/types"
	"net"
	"net/http"
	"os"
)

const KettoudPath = "/tmp/kettoud.sock"

var currentUser *types.User = nil
var matchState *types.Match = nil

func UpdateCurrentUser() {
	u, err := services.GetCurrentUser()
	if err != nil {
		fmt.Println(err)
	}
	currentUser = &u
}

func authorizeAction() bool {
	if currentUser == nil {
		fmt.Println("Not logged in. Please login before doing this!!!")
		return false
	}
	return true
}

func StartDaemon() error {
	UpdateCurrentUser()

	_ = os.Remove(KettoudPath)

	ln, err := net.Listen("unix", KettoudPath)
	if err != nil {
		return err
	}
	defer ln.Close()

	fmt.Println("Daemon started at ", KettoudPath)

	mux := http.NewServeMux()

	mux.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("daemon is running\n"))
	})

	mux.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		var payload types.LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		res, err := services.Login(types.LoginRequest{
			Username: payload.Username,
			Password: payload.Password,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	})

	mux.HandleFunc("/match/create", func(w http.ResponseWriter, r *http.Request) {
		if !authorizeAction() {
			return
		}
		var payload types.EmitMatchCreate
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		res := services.EmitEventWithAck[types.EmitMatchCreateAck]("match:create",
			types.EmitMatchCreate{
				GameId:    payload.GameId,
				MatchType: payload.MatchType,
			})

		w.Header().Set("Content-Type", "application/json")

		json.NewEncoder(w).Encode(res)
	})

	mux.HandleFunc("/match/join", func(w http.ResponseWriter, r *http.Request) {
		if !authorizeAction() {
			return
		}

		var payload struct {
			MatchId string `json:"matchId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		services.EmitEvent("match:join",
			types.EmitMatchJoin{
				MatchId: payload.MatchId,
				User:    *currentUser,
			})
	})

	mux.HandleFunc("/match/start", func(w http.ResponseWriter, r *http.Request) {
		if !authorizeAction() {
			return
		}

		var payload struct {
			MatchId string `json:"matchId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		ackData := services.EmitEventWithAck[struct {
			Ok bool `json:"ok"`
		}]("match:start",
			types.EmitMatchAction{
				MatchId: payload.MatchId,
				UserId:  (*currentUser).Id,
			})

		w.Header().Set("Content-Type", "application/json")

		json.NewEncoder(w).Encode(ackData)
	})

	mux.HandleFunc("/match/roll-dice", func(w http.ResponseWriter, r *http.Request) {
		if !authorizeAction() {
			return
		}

		var payload struct {
			MatchId string `json:"matchId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		services.EmitEvent("match:roll-dice",
			types.EmitMatchAction{
				MatchId: payload.MatchId,
				UserId:  (*currentUser).Id,
			})
	})

	mux.HandleFunc("/match/move", func(w http.ResponseWriter, r *http.Request) {
		if !authorizeAction() {
			return
		}

		var payload struct {
			MatchId string     `json:"matchId"`
			Move    types.Move `json:"move"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		services.EmitEvent("match:finish-move",
			types.EmitMatchMove{
				MatchId: payload.MatchId,
				UserId:  (*currentUser).Id,
				Move:    payload.Move,
			})
	})

	mux.HandleFunc("/match/cannot-move", func(w http.ResponseWriter, r *http.Request) {
		if !authorizeAction() {
			return
		}

		var payload struct {
			MatchId string `json:"matchId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		services.EmitEvent("match:cannot-move",
			types.EmitMatchAction{
				MatchId: payload.MatchId,
				UserId:  (*currentUser).Id,
			})
	})

	return http.Serve(ln, mux)
}
