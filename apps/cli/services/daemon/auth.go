package daemon

import (
	"encoding/json"
	"fmt"
	"kettou/services"
	"kettou/types"
	"net/http"
)

func (s *DaemonServer) updateCurrentUser() {
	u, err := services.GetCurrentUser()
	if err != nil {
		fmt.Println(err)
	}
	s.currentUser = &u
}

func (s *DaemonServer) handleLogin(w http.ResponseWriter, r *http.Request) {
	var payload types.LoginRequest
	if !s.decodeJSON(w, r, &payload) {
		return
	}

	res, err := services.Login(payload)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	s.updateCurrentUser()
	services.ConnectSocket()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (s *DaemonServer) handleLogout(w http.ResponseWriter, r *http.Request) {
	res, err := services.Logout()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	s.updateCurrentUser()
	services.DisconnectSocket()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
