package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mini-games-tui/types"

	tea "charm.land/bubbletea/v2"
)

type ErrMsg error
type LoggedInMsg string

func Login(u types.LoginRequest) tea.Cmd {
	return func() tea.Msg {
		jsonData, err := json.Marshal(u)
		if err != nil {
			return ErrMsg(err)
		}
		res, err := Client.Post(
			"http://localhost:3000/login", "application/json",
			bytes.NewBuffer(jsonData))
		if err != nil {
			return ErrMsg(err)
		}
		defer res.Body.Close()

		bodyBytes, err := io.ReadAll(res.Body)
		bodyPayload := string(bodyBytes)

		fmt.Printf("Response Status: %v\n", res.Status)
		fmt.Printf("Login response: %+v", bodyPayload)
		fmt.Printf("Cookies: %+v", res.Cookies())

		_ = SaveCookies()

		return LoggedInMsg("login success")
	}
}
