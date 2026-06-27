package types

import (
	tea "charm.land/bubbletea/v2"
)

type ErrMsg error

type LoggedInMsg string

type CurrentUserMsg User

type LogoutMsg string

type ListGamesMsg []Game

type PushScreenMsg tea.Model

type PopScreenMsg struct{}

type SocketEventMsg struct {
	Event string
	Data  any
}
