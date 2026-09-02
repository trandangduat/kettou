package cmd

import (
	"fmt"
	"kettou/services"
	"kettou/services/daemon"

	"github.com/spf13/cobra"
)

var daemonCmd = &cobra.Command{
	Use:   "daemon",
	Short: "Kettou daemon",
}

var daemonStartCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the Kettou daemon",
	RunE: func(cmd *cobra.Command, args []string) error {
		services.SwitchSession("cookies.json")
		services.ConnectSocket()
		go func() {
			for {
				fmt.Println("Wait for socket...")
				services.WaitForSocket()
			}
		}()
		return daemon.StartDaemonServer()
	},
}

func init() {
	daemonCmd.AddCommand(daemonStartCmd)
	rootCmd.AddCommand(daemonCmd)
}
