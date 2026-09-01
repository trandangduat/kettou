package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"kettou/cmd/daemon"

	"github.com/spf13/cobra"
)

var startMatchCmd = &cobra.Command{
	Use:   "start",
	Short: "Start a match",
	Run: func(cmd *cobra.Command, args []string) {
		client := daemon.NewHttpClient()
		payload := struct {
			MatchId string `json:"matchId"`
		}{
			MatchId: matchId,
		}
		bodyBytes, err := json.Marshal(payload)
		res, err := client.Post(
			"http://kettoud:/match/start",
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

		fmt.Printf("Started match with ID: %s\n", matchId)
	},
}

func init() {
	matchCmd.AddCommand(startMatchCmd)
}
