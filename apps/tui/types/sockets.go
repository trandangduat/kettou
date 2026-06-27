package types

type LobbyUpdate struct {
	RoomsId []string `json:"roomsId"`
}

type RoomCreate struct {
	RoomId string `json:"roomId"`
}

type RoomLeave struct {
	RoomId string `json:"roomId"`
}

type EmitLobbyJoin struct {
	GameId string `json:"gameId"`
}
