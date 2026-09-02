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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (s *DaemonServer) handleMatchJoin(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAction() {
		return
	}

	var payload struct {
		MatchId string `json:"matchId"`
	}
	if !s.decodeJSON(w, r, &payload) {
		return
	}

	services.EmitEvent("match:join",
		types.EmitMatchJoin{
			MatchId: payload.MatchId,
			User:    *s.currentUser,
		})
}

func (s *DaemonServer) handleMatchStart(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAction() {
		return
	}

	var payload struct {
		MatchId string `json:"matchId"`
	}
	if !s.decodeJSON(w, r, &payload) {
		return
	}

	ackData := services.EmitEventWithAck[struct {
		Ok bool `json:"ok"`
	}]("match:start",
		types.EmitMatchAction{
			MatchId: payload.MatchId,
			UserId:  (*s.currentUser).Id,
		})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ackData)
}

func (s *DaemonServer) handleMatchRollDice(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAction() {
		return
	}

	var payload struct {
		MatchId string `json:"matchId"`
	}
	if !s.decodeJSON(w, r, &payload) {
		return
	}

	services.EmitEvent("match:roll-dice",
		types.EmitMatchAction{
			MatchId: payload.MatchId,
			UserId:  (*s.currentUser).Id,
		})
}

func (s *DaemonServer) handleMatchMove(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAction() {
		return
	}

	var payload struct {
		MatchId string     `json:"matchId"`
		Move    types.Move `json:"move"`
	}
	if !s.decodeJSON(w, r, &payload) {
		return
	}

	services.EmitEvent("match:finish-move",
		types.EmitMatchMove{
			MatchId: payload.MatchId,
			UserId:  (*s.currentUser).Id,
			Move:    payload.Move,
		})
}

func (s *DaemonServer) handleMatchCannotMove(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAction() {
		return
	}

	var payload struct {
		MatchId string `json:"matchId"`
	}
	if !s.decodeJSON(w, r, &payload) {
		return
	}

	services.EmitEvent("match:cannot-move",
		types.EmitMatchAction{
			MatchId: payload.MatchId,
			UserId:  (*s.currentUser).Id,
		})
}
