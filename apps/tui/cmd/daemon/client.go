package daemon

import (
	"context"
	"net"
	"net/http"
)

func NewHttpClient() *http.Client {
	return &http.Client{
		Transport: &http.Transport{
			DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
				return net.Dial("unix", KettoudPath)
			},
		},
	}
}
