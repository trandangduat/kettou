package cmd

import (
	"kettou/cmd/daemon"
	"kettou/services"

	"github.com/spf13/cobra"
)

var daemonCmd = &cobra.Command{
	Use: "daemon",
}

var daemonStartCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the Kettou daemon",
	RunE: func(cmd *cobra.Command, args []string) error {
		services.SwitchSession("cli_cookies.json")
		services.ConnectSocket()
		return daemon.StartDaemon()
	},
}

func init() {
	daemonCmd.AddCommand(daemonStartCmd)
	rootCmd.AddCommand(daemonCmd)
}
