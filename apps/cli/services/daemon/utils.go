package daemon

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func (s *DaemonServer) authorizeAction() bool {
	if s.currentUser == nil {
		fmt.Println("Not logged in. Please login before doing this!!!")
		return false
	}
	return true
}

func (s *DaemonServer) decodeJSON(w http.ResponseWriter, r *http.Request, payload any) bool {
	if err := json.NewDecoder(r.Body).Decode(payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return false
	}
	return true
}
