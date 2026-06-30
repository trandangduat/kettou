package cmd

import (
	"fmt"
	"kettou/services"
	"kettou/types"

	"github.com/spf13/cobra"
)

var username string
var password string

var loginCmd = &cobra.Command{
    Use:   "login",
    Short: "Login to Kettou",
    Run: func(cmd *cobra.Command, args []string) {
    	res, err := services.Login(types.LoginRequest{
    		Username: username,
    		Password: password,
    	})
    	if err != nil {
    		fmt.Println(err)
    		return
    	}

        fmt.Println(res)
    },
}

func init() {
    cliCmd.AddCommand(loginCmd)

    loginCmd.Flags().StringVarP(&username, "username", "u", "", "Username")
    loginCmd.Flags().StringVarP(&password, "password", "p", "", "Password")

    loginCmd.MarkFlagRequired("username")
    loginCmd.MarkFlagRequired("password")
}
