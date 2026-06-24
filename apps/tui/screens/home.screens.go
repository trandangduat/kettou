package screens

import (
	"kettou/services"
	"kettou/types"
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

type HomeScreen struct {
	logOutFocused bool
	currentUser   types.User
}

func InitHomeScreen(cu types.User) HomeScreen {
	return HomeScreen{
		logOutFocused: true,
		currentUser:   cu,
	}
}

func (m HomeScreen) Init() tea.Cmd {
	return nil
}

func (m HomeScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	var cmd tea.Cmd

	cmds = append(cmds, cmd)

	switch msg := msg.(type) {
	case tea.KeyPressMsg:
		switch msg.String() {
		case "enter":
			if m.logOutFocused {
				cmd = services.Logout()
				cmds = append(cmds, cmd)
			}
		}
	}
	return m, tea.Batch(cmds...)
}

func (m HomeScreen) View() tea.View {
	var s strings.Builder

	s.WriteString("main screen!\n")

	logOutBtnStyle := lipgloss.NewStyle()
	if m.logOutFocused == true {
		logOutBtnStyle = logOutBtnStyle.Background(lipgloss.Color("18"))
	}
	s.WriteString(logOutBtnStyle.Render("[Logout]"))

	return tea.NewView(s.String())
}
