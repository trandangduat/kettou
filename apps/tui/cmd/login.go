package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"kettou/cmd/daemon"
	"kettou/types"

	"github.com/spf13/cobra"
)

var username string
var password string

var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Login to Kettou",
	Run: func(cmd *cobra.Command, args []string) {
		client := daemon.NewHttpClient()
		payload := types.LoginRequest{
			Username: username,
			Password: password,
		}
		bodyData, err := json.Marshal(payload)
		if err != nil {
			fmt.Println(err)
			return
		}

		res, err := client.Post("http://kettoud/login", "application/json", bytes.NewReader(bodyData))
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
		fmt.Println(string(resBytes))
	},
}

func init() {
	cliCmd.AddCommand(loginCmd)

	loginCmd.Flags().StringVarP(&username, "username", "u", "", "Username")
	loginCmd.Flags().StringVarP(&password, "password", "p", "", "Password")

	loginCmd.MarkFlagRequired("username")
	loginCmd.MarkFlagRequired("password")
}
