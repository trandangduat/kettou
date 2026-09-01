package services

import (
	"net/http"
	"os"
	"path/filepath"

	jujuCookiejar "github.com/juju/persistent-cookiejar"
)

var Client *http.Client
var jar *jujuCookiejar.Jar
var configDir string

func init() {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "."
	}
	configDir = filepath.Join(homeDir, ".kettou")
	_ = os.MkdirAll(configDir, 0755)
}

func SwitchSession(cookieFile string) {
	jarFile := filepath.Join(configDir, cookieFile)

	var jarErr error
	jar, jarErr = jujuCookiejar.New(&jujuCookiejar.Options{
		Filename: jarFile,
	})
	if jarErr != nil {
		panic("Failed to init cookie jar: " + jarErr.Error())
	}

	Client = &http.Client{
		Jar: jar,
	}
}

func SaveCookies() error {
	if jar != nil {
		return jar.Save()
	}
	return nil
}
