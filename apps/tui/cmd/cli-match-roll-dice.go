package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"kettou/cmd/daemon"

	"github.com/spf13/cobra"
)

var matchRollDiceCmd = &cobra.Command{
	Use:   "roll-dice",
	Short: "Roll the dice in the current match",
	Run: func(cmd *cobra.Command, args []string) {
		client := daemon.NewHttpClient()
		payload := struct {
			MatchId string `json:"matchId"`
		}{
			MatchId: matchId,
		}
		bodyBytes, err := json.Marshal(payload)
		res, err := client.Post(
			"http://kettoud:/match/roll-dice",
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

		fmt.Printf("You have rolled the dice.")
	},
}

func init() {
	matchCmd.AddCommand(matchRollDiceCmd)
}
