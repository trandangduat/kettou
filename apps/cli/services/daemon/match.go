package daemon

import (
	"encoding/json"
	"kettou/services"
	"kettou/types"
	"net/http"
)

func (s *DaemonServer) handleMatchCreate(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAction() {
		return
	}
	var payload types.EmitMatchCreate
	if !s.decodeJSON(w, r, &payload) {
		return
	}

	res := services.EmitEventWithAck[types.EmitMatchCreateAck]("match:create",
		types.EmitMatchCreate{
			GameId:    payload.GameId,
			MatchType: payload.MatchType,
		})

	services.EmitEvent("match:join", res.MatchId)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (s *DaemonServer) handleMatchJoin(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAction() {
		return
	}

	var matchId string
	if !s.decodeJSON(w, r, &matchId) {
		return
	}

	res := services.EmitEventWithAck[types.EmitMatchJoinAck]("match:join", matchId)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (s *DaemonServer) handleMatchLeave(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAction() {
		return
	}

	var matchId string
	if !s.decodeJSON(w, r, &matchId) {
		return
	}

	res := services.EmitEventWithAck[types.EmitMatchLeaveAck]("match:leave", matchId)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (s *DaemonServer) handleMatchStart(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAction() {
		return
	}

	var matchId string
	if !s.decodeJSON(w, r, &matchId) {
		return
	}

	res := services.EmitEventWithAck[types.EmitMatchStartAck]("match:start", matchId)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (s *DaemonServer) handleMatchAction(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAction() {
		return
	}

	var payload types.EmitMatchAction
	if !s.decodeJSON(w, r, &payload) {
		return
	}

	res := services.EmitEventWithAck[types.EmitMatchActionAck]("match:action", payload)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
