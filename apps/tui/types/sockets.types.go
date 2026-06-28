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

type EmitRoomJoin struct {
	RoomId string            `json:"roomId"`
	User   map[string]string `json:"user"`
}

type EmitRoomLeave struct {
	RoomId string            `json:"roomId"`
	User   map[string]string `json:"user"`
}

type EmitMatchAction struct {
	RoomId string `json:"roomId"`
	UserId string `json:"userId"`
}
