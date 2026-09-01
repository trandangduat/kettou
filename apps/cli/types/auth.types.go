package types

type LoginRequest struct {
	Id       string `json:"id"`
	Password string `json:"password"`
}

type User struct {
	Id  string  `json:"id"`
	Elo float64 `json:"elo"`
}
