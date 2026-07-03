package cmd

import (
	"github.com/spf13/cobra"
)

var matchId string

var matchCmd = &cobra.Command{
	Use:   "match",
	Short: "Interact with a match (join, leave, start, move,...)",
}

func init() {
	cliCmd.AddCommand(matchCmd)

	matchCmd.PersistentFlags().StringVar(&matchId, "matchId", "", "Match ID")
	matchCmd.MarkFlagRequired("matchId")
}
