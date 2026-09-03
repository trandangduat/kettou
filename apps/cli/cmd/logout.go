package cmd

import (
	"bytes"
	"fmt"
	"io"
	"kettou/services/daemon"

	"github.com/spf13/cobra"
)

var logoutCmd = &cobra.Command{
	Use:   "logout",
	Short: "Logout from Kettou",
	Run: func(cmd *cobra.Command, args []string) {
		client := daemon.NewHttpClient()
		res, err := client.Post(
			"http://kettoud/logout",
			"application/json",
			bytes.NewReader(nil))

		if err != nil {
			fmt.Println("Kettou daemon is not running. Start it first with 'kettou daemon'")
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
		fmt.Println(string(resBytes))
	},
}

func init() {
	rootCmd.AddCommand(logoutCmd)
}
