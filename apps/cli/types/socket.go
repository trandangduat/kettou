package types

type SocketEventMsg struct {
	Event string
	Data  any
}

type LobbyUpdate struct {
	MatchIds []string `json:"matchIds"`
}

type MatchCreated struct {
	MatchId string `json:"matchId"`
}

type MatchDeleted struct {
	MatchId string `json:"matchId"`
}

type EmitLobbyJoin struct {
	GameId string `json:"gameId"`
}

type EmitMatchCreate struct {
	GameId    string    `json:"gameId"`
	MatchType MatchType `json:"matchType"`
}

type EmitAck struct {
	Ok    *bool   `json:"ok,omitempty"`
	Error *string `json:"error,omitempty"`
}

type EmitMatchCreateAck struct {
	EmitAck
	MatchId string `json:"matchId"`
}

type EmitMatchJoinAck struct{ EmitAck }
type EmitMatchLeaveAck struct{ EmitAck }
type EmitMatchStartAck struct{ EmitAck }

type EmitMatchAction struct {
	MatchId string `json:"matchId"`
	UserId  string `json:"userId"`
}

type EmitMatchMove struct {
	MatchId string `json:"matchId"`
	UserId  string `json:"userId"`
	Move    Move   `json:"move"`
}
