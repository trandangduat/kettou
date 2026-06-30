package cmd

import (
	"kettou/services"

	"github.com/spf13/cobra"
)

var cliCmd = &cobra.Command{
	Use:   "cli",
	Short: "Run the CLI version of Kettou.",
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		services.SwitchSession("cli_cookies.json")
	},
}

func init() {
	rootCmd.AddCommand(cliCmd)
}
