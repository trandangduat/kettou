package screens

import (
	"kettou/services"
	"kettou/theme"
	"kettou/types"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

type focusedMode int

const (
	modeRanked focusedMode = iota
	modeCasual
	modeJoinRoom
)

type HomeScreen struct {
	focusedMode focusedMode
	currentUser types.User
}

func InitHomeScreen(cu types.User) HomeScreen {
	return HomeScreen{
		focusedMode: modeRanked,
		currentUser: cu,
	}
}

func (m HomeScreen) Init() tea.Cmd {
	return nil
}

func (m HomeScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyPressMsg:
		switch msg.String() {
		case "left", "h":
			m.focusedMode = (m.focusedMode - 1 + 3) % 3
		case "right", "l":
			m.focusedMode = (m.focusedMode + 1) % 3
		case "enter":
			switch m.focusedMode {
			case modeRanked:
			case modeCasual:
				cmds = append(cmds, func() tea.Msg {
					return types.PushScreenMsg(InitCasualScreen(m.currentUser))
				})
			case modeJoinRoom:
			}

		case "alt+l":
			cmds = append(cmds, services.Logout())

		}
	}
	return m, tea.Batch(cmds...)
}

var (
	cardStyle = lipgloss.NewStyle().
			Border(lipgloss.ThickBorder()).
			BorderForeground(theme.ColorMuted).
			Padding(1, 1).
			Align(lipgloss.Center).
			Width(20).
			Height(4)

	activeCardStyle = cardStyle.
			BorderForeground(theme.ColorPrimary).
			Bold(true)

	footerStyle = lipgloss.NewStyle().
			Foreground(theme.ColorMuted).
			MarginTop(2)
)

func (m HomeScreen) View() tea.View {
	cards := []string{
		"RANKED",
		"CASUAL",
		"JOIN ROOM",
	}

	var renderedCards []string
	for i, c := range cards {
		if m.focusedMode == focusedMode(i) {
			renderedCards = append(renderedCards, activeCardStyle.Render(c))
		} else {
			renderedCards = append(renderedCards, cardStyle.Render(c))
		}
	}

	cardRow := lipgloss.JoinHorizontal(lipgloss.Top, renderedCards[0], "  ", renderedCards[1], "  ", renderedCards[2])
	layout := lipgloss.JoinVertical(lipgloss.Center, cardRow, "\n")

	return tea.NewView(layout)
}
