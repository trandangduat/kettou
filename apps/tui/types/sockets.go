package types

type LobbyUpdate struct {
	RoomsId []string `json:"roomsId"`
}
type EmitLobbyJoin struct {
	GameId string `json:"gameId"`
}
