package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"kettou/services/daemon"
	"kettou/types"

	"github.com/spf13/cobra"
)

var leaveMatchCmd = &cobra.Command{
	Use:   "leave",
	Short: "Leave a match",
	Run: func(cmd *cobra.Command, args []string) {
		client := daemon.NewHttpClient()
		bodyBytes, err := json.Marshal(matchId)
		res, err := client.Post(
			"http://kettoud:/match/leave",
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

		var ackData types.EmitMatchLeaveAck
		if err := DecodeAckData(res.Body, &ackData); err != nil {
			fmt.Println(err)
			return
		}

		fmt.Printf("Left match with ID: %s\n", matchId)
	},
}

func init() {
	matchCmd.AddCommand(leaveMatchCmd)
}
