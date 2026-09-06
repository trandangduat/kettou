package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"kettou/services/daemon"
	"kettou/types"

	"github.com/spf13/cobra"
)

var action string

var matchActionCmd = &cobra.Command{
	Use:   "action",
	Short: "Perform an action on a match",
	Run: func(cmd *cobra.Command, args []string) {
		client := daemon.NewHttpClient()
		payload := types.EmitMatchAction{
			MatchId: matchId,
			Action:  json.RawMessage(action),
		}
		bodyBytes, err := json.Marshal(payload)
		res, err := client.Post(
			"http://kettoud:/match/action",
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

		var ackData types.EmitMatchActionAck
		if err := DecodeAckData(res.Body, &ackData); err != nil {
			fmt.Println(err)
			return
		}

		fmt.Println("Performed action " + action + " on match " + matchId)
	},
}

func init() {
	matchCmd.AddCommand(matchActionCmd)

	matchActionCmd.PersistentFlags().StringVar(&action, "action", "", "Action to perform")

}
