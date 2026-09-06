package types

import "encoding/json"

type MatchStatus string
type MatchType string
type PlayerStatus string

const (
	MatchStatusWaiting MatchStatus = "WAITING"
	MatchStatusReady   MatchStatus = "READY"
	MatchStatusPlaying MatchStatus = "PLAYING"
	MatchStatusEnded   MatchStatus = "ENDED"
)

const (
	MatchTypeCustom MatchType = "CUSTOM"
	MatchTypeRanked MatchType = "RANKED"
)

const (
	PlayerStatusOnline  PlayerStatus = "ONLINE"
	PlayerStatusOffline PlayerStatus = "OFFLINE"
)

type Match struct {
	Id        string          `json:"id"`
	GameID    string          `json:"gameId"`
	MatchType MatchType       `json:"matchType"`
	Status    MatchStatus     `json:"status"`
	Players   []Player        `json:"players"`
	EndState  *EndState       `json:"endState"`
	CreatedAt int64           `json:"createdAt"`
	GameState json.RawMessage `json:"gameState"`
}

type Player struct {
	UserId string       `json:"userId"`
	Elo    int          `json:"elo"`
	Status PlayerStatus `json:"status"`
}

type EndState struct {
	WinnerId string          `json:"winnerId"`
	Reason   string          `json:"reason"`
	Scores   *map[string]int `json:"scores"`
}
