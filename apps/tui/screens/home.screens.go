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
}

func InitHomeScreen(cu types.User) HomeScreen {
	return HomeScreen{
		focusedMode: modeRanked,
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
			if m.focusedMode > modeRanked {
				m.focusedMode--
			}
		case "right", "l":
			if m.focusedMode < modeJoinRoom {
				m.focusedMode++
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

	footer := footerStyle.Render("[←/→/h/l] Navigate   |   [Enter] Select   |   [q/Esc] Quit")

	// Lắp ghép phần thẻ game và footer
	layout := lipgloss.JoinVertical(lipgloss.Center, cardRow, "\n", footer)

	return tea.NewView(layout)
}
