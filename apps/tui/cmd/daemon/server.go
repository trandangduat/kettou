package daemon

import (
	"encoding/json"
	"fmt"
	"kettou/services"
	"kettou/types"
	"net"
	"net/http"
	"os"
)

const KettoudPath = "/tmp/kettoud.sock"

func StartDaemon() error {
	_ = os.Remove(KettoudPath)

	ln, err := net.Listen("unix", KettoudPath)
	if err != nil {
		return err
	}
	defer ln.Close()

	fmt.Println("Daemon started at ", KettoudPath)

	mux := http.NewServeMux()

	mux.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("daemon is running\n"))
	})

	mux.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		var payload types.LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		res, err := services.Login(types.LoginRequest{
			Username: payload.Username,
			Password: payload.Password,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	})

	return http.Serve(ln, mux)
}
