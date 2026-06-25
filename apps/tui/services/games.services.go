package services

import (
	"encoding/json"
	"io"
	"kettou/types"
	"log"

	tea "charm.land/bubbletea/v2"
)

func FetchGames() tea.Cmd {
	return func() tea.Msg {
		res, err := Client.Get("http://localhost:3000/games")
		if err != nil {
			return types.ErrMsg(err)
		}
		defer res.Body.Close()

		bodyBytes, err := io.ReadAll(res.Body)
		if err != nil {
			return types.ErrMsg(err)
		}
		var games []types.Game
		err = json.Unmarshal(bodyBytes, &games)
		if err != nil {
			return types.ErrMsg(err)
		}

		log.Printf("Response Status: %v\n", res.Status)
		log.Printf("All Games: %+v", games)

		return types.ListGamesMsg(games)
	}
}
