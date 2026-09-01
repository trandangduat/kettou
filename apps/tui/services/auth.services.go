package services

import (
	"bytes"
	"encoding/json"
	"io"
	"kettou/types"
	"log"
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

func GetCurrentUser() (types.User, error) {
	res, err := Client.Get("http://localhost:3000/me")
	if err != nil {
		return types.User{}, err
	}
	defer res.Body.Close()

	bodyBytes, err := io.ReadAll(res.Body)
	if err != nil {
		return types.User{}, err
	}
	var u types.User
	err = json.Unmarshal(bodyBytes, &u)
	if err != nil {
		return types.User{}, err
	}

	log.Printf("Response Status: %v\n", res.Status)
	log.Printf("Current User: %+v", u)

	return u, nil
}
