package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"kettou/cmd/daemon"
	"kettou/types"

	"github.com/spf13/cobra"
)

var moveStr string
var diceNumber int

var matchMoveCmd = &cobra.Command{
	Use:   "move",
	Short: "Perform a move in the current match",
	Run: func(cmd *cobra.Command, args []string) {
		client := daemon.NewHttpClient()
		move := types.Move{
			R:   int(moveStr[0]-'a') + 1,
			C:   int(moveStr[1]-'1') + 1,
			Len: diceNumber,
		}
		payload := struct {
			MatchId string     `json:"matchId"`
			Move    types.Move `json:"move"`
		}{
			MatchId: matchId,
			Move:    move,
		}
		bodyBytes, err := json.Marshal(payload)
		res, err := client.Post(
			"http://kettoud:/match/move",
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

		fmt.Printf("You moved!")
	},
}

func init() {
	matchCmd.AddCommand(matchMoveCmd)
	matchMoveCmd.Flags().StringVar(&moveStr, "moveStr", "", "Move string (a1, a6, d1, c7...)")
	matchMoveCmd.Flags().IntVar(&diceNumber, "diceNumber", -1, "Your dice number")
}
