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

var startMatchCmd = &cobra.Command{
	Use:   "start",
	Short: "Start a match",
	Run: func(cmd *cobra.Command, args []string) {
		client := daemon.NewHttpClient()
		bodyBytes, err := json.Marshal(matchId)
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

		resBytes, err := io.ReadAll(res.Body)
		if err != nil {
			fmt.Println(err)
			return
		}

		var ackData types.EmitMatchLeaveAck
		json.Unmarshal(resBytes, &ackData)
		if ackData.Error != nil {
			fmt.Println(*ackData.Error)
			return
		}

		fmt.Printf("Started match with ID: %s\n", matchId)
	},
}

func init() {
	matchCmd.AddCommand(startMatchCmd)
}
