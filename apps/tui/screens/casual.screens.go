package screens

import (
	"kettou/services"
	"kettou/types"
	"strings"

	tea "charm.land/bubbletea/v2"
)

type CasualScreen struct {
	focusedGame int
	listGames   []types.Game
}

func InitCasualScreen() CasualScreen {
	return CasualScreen{
		focusedGame: 0,
		listGames:   []types.Game{},
	}
}

func (c CasualScreen) Init() tea.Cmd {
	cmd := services.FetchGames()
	return cmd
}

func (c CasualScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	// var cmd tea.Cmd
	gamesCount := len(c.listGames)
	switch msg := msg.(type) {
	case tea.KeyPressMsg:
		switch msg.String() {
		case "up", "k":
			c.focusedGame = (c.focusedGame - 1 + gamesCount) % gamesCount
		case "down", "j":
			c.focusedGame = (c.focusedGame + 1) % gamesCount
		case "ctrl+p":
			cmds = append(cmds, func() tea.Msg { return types.ChangeScreenMsg(InitHomeScreen()) })
		}
	case services.ListGamesMsg:
		c.listGames = msg
	}
	return c, tea.Batch(cmds...)
}

func (c CasualScreen) View() tea.View {
	var s strings.Builder

	for i, game := range c.listGames {
		if i == c.focusedGame {
			s.WriteString("> ")
		} else {
			s.WriteString("  ")
		}
		s.WriteString(game.Id)
		s.WriteString("\n")
	}

	return tea.NewView(s.String())
}
