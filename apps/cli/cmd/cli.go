package cmd

import (
	"github.com/spf13/cobra"
)

var cliCmd = &cobra.Command{
	Use:   "cli",
	Short: "Run the CLI version of Kettou.",
}

func init() {
	rootCmd.AddCommand(cliCmd)
}
