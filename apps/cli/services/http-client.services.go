package services

import (
	"net/http"
	"os"
	"path/filepath"

	jujuCookiejar "github.com/juju/persistent-cookiejar"
)

var Client *http.Client
var cookiesJar *jujuCookiejar.Jar
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

	var err error
	cookiesJar, err = jujuCookiejar.New(&jujuCookiejar.Options{
		Filename: jarFile,
	})
	if err != nil {
		panic("Failed to init cookie jar: " + err.Error())
	}

	Client = &http.Client{
		Jar: cookiesJar,
	}
}

func SaveCookies() error {
	if cookiesJar != nil {
		return cookiesJar.Save()
	}
	return nil
}
