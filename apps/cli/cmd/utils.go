package cmd

import (
	"encoding/json"
	"io"
	"kettou/types"
)

func DecodeAckData(r io.Reader, ackData types.AckResponse) error {
	if err := json.NewDecoder(r).Decode(ackData); err != nil {
		return err
	}
	return ackData.GetError()
}
