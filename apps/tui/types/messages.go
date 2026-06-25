package types

import (
	tea "charm.land/bubbletea/v2"
)

type ErrMsg error
type LoggedInMsg string
type CurrentUserMsg User
type LogoutMsg string
type ListGamesMsg []Game
type ChangeScreenMsg tea.Model
