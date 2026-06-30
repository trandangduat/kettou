package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "kettou",
	Short: "Kettou is a hub of duel games.",
	Long:  "",
	Run: func(cmd *cobra.Command, args []string) {
		tuiCmd.Run(cmd, args)
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
