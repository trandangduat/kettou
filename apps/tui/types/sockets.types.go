package types

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

type EmitMatchCreateAck struct {
	MatchId string `json:"matchId"`
}

type EmitMatchJoin struct {
	MatchId string `json:"matchId"`
	User    User   `json:"user"`
}

type EmitMatchLeave struct {
	MatchId string `json:"matchId"`
	User    User   `json:"user"`
}

type EmitMatchAction struct {
	MatchId string `json:"matchId"`
	UserId  string `json:"userId"`
}

type EmitMatchMove struct {
	MatchId string `json:"matchId"`
	UserId  string `json:"userId"`
	Move    Move   `json:"move"`
}
