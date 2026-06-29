package types

type Match struct {
	Id          string      `json:"id"`
	GameID      string      `json:"gameId"`
	MatchType   MatchType   `json:"matchType"`
	Status      MatchStatus `json:"status"`
	Players     []Player    `json:"players"`
	RoundNumber int         `json:"roundNumber"`
	Rounds      []Round     `json:"rounds"`
	Turn        int         `json:"turn"`
	EndState    EndState    `json:"endState"`
}

type Move struct {
	R   int `json:"r"`
	C   int `json:"c"`
	Len int `json:"len"`
}

type Player struct {
	UserId   string `json:"userId"`
	Username string `json:"username"`
	Elo      int    `json:"elo"`
}

type Round struct {
	Moves      []Move `json:"moves"`
	DiceNumber int    `json:"diceNumber"`
	PlayerId   string `json:"playerId"`
}

type EndState struct {
	WinnerUserId string         `json:"winnerUserId"`
	PlayerPoints map[string]int `json:"playerPoints"`
}

type MatchStatus string
type MatchType string

const (
	MatchStatusWaiting MatchStatus = "WAITING"
	MatchStatusReady   MatchStatus = "READY"
	MatchStatusPlaying MatchStatus = "PLAYING"
	MatchStatusEnded   MatchStatus = "ENDED"
)

const (
	CUSTOM MatchType = "CUSTOM"
	RANKED MatchType = "RANKED"
)
