package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"kettou/services/daemon"
	"kettou/types"

	"github.com/spf13/cobra"
)

var gameId string

var createMatchCmd = &cobra.Command{
	Use:   "create-match",
	Short: "Create a new match",
	Run: func(cmd *cobra.Command, args []string) {
		client := daemon.NewHttpClient()
		payload := types.EmitMatchCreate{
			GameId:    gameId,
			MatchType: types.MatchTypeCustom,
		}
		bodyBytes, err := json.Marshal(payload)
		res, err := client.Post(
			"http://kettoud:/match/create",
			"application/json",
			bytes.NewReader(bodyBytes),
		)
		if err != nil {
			fmt.Println(err)
			return
		}
		defer res.Body.Close()

		if res.StatusCode != 200 {
			fmt.Println("Status code:", res.StatusCode)
			return
		}

		resBytes, err := io.ReadAll(res.Body)
		if err != nil {
			fmt.Println(err)
			return
		}

		var ackData types.EmitMatchCreateAck
		json.Unmarshal(resBytes, &ackData)
		fmt.Printf("Created match with ID: %s\n", ackData.MatchId)
	},
}

func init() {
	rootCmd.AddCommand(createMatchCmd)

	createMatchCmd.Flags().StringVar(&gameId, "gameId", "", "Game ID")
	createMatchCmd.MarkFlagRequired("gameId")
}
