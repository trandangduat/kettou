package services

import (
	"bytes"
	"encoding/json"
	"io"
	"kettou/types"
	"log"

	tea "charm.land/bubbletea/v2"
)

func Login(u types.LoginRequest) (string, error) {
	jsonData, err := json.Marshal(u)
	if err != nil {
		return "Login failed", err
	}
	res, err := Client.Post(
		"http://localhost:3000/login", "application/json",
		bytes.NewBuffer(jsonData))
	if err != nil {
		return "Login failed", err
	}
	defer res.Body.Close()

	bodyBytes, err := io.ReadAll(res.Body)
	bodyPayload := string(bodyBytes)

	log.Printf("Response Status: %v\n", res.Status)
	log.Printf("Login response: %+v", bodyPayload)

	_ = SaveCookies()

	return bodyPayload, nil
}

func LoginCmd(u types.LoginRequest) tea.Cmd {
	return func() tea.Msg {
		res, err := Login(u)
		if err != nil {
			return types.ErrMsg(err)
		}
		return types.LoggedInMsg(res)
	}
}

func FetchMe() tea.Cmd {
	return func() tea.Msg {
		res, err := Client.Get("http://localhost:3000/me")
		if err != nil {
			return types.ErrMsg(err)
		}
		defer res.Body.Close()

		bodyBytes, err := io.ReadAll(res.Body)
		if err != nil {
			return types.ErrMsg(err)
		}
		var u types.User
		err = json.Unmarshal(bodyBytes, &u)
		if err != nil {
			return types.ErrMsg(err)
		}

		log.Printf("Response Status: %v\n", res.Status)
		log.Printf("Current User: %+v", u)

		return types.CurrentUserMsg(u)
	}
}

func Logout() tea.Cmd {
	return func() tea.Msg {
		res, err := Client.Get("http://localhost:3000/logout")
		if err != nil {
			return types.ErrMsg(err)
		}
		defer res.Body.Close()

		msg, err := io.ReadAll(res.Body)
		if err != nil {
			return types.ErrMsg(err)
		}

		log.Printf("Response Status: %v\n", res.Status)
		for k, vs := range res.Header {
			for _, value := range vs {
				log.Printf("%s: %s\n", k, value)
			}
		}

		_ = SaveCookies()

		return types.LogoutMsg(msg)
	}

}
