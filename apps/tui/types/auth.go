package types

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type User struct {
	Id       string  `json:"id"`
	Username string  `json:"username"`
	Elo      float64 `json:"elo"`
}
