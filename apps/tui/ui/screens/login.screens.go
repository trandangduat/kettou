package screens

import (
	"kettou/ui/components"
	"strings"

	tea "charm.land/bubbletea/v2"
)

type LoginScreen struct {
	loginForm components.FormModel
}

func InitLoginScreen() LoginScreen {
	return LoginScreen{
		loginForm: components.NewForm([]string{"username", "password"}),
	}
}

func (m LoginScreen) Init() tea.Cmd {
	var cmds []tea.Cmd
	var cmd tea.Cmd

	cmd = m.loginForm.Init()
	cmds = append(cmds, cmd)
	return tea.Batch(cmds...)
}

func (m LoginScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	var cmd tea.Cmd

	m.loginForm, cmd = m.loginForm.Update(msg)
	cmds = append(cmds, cmd)
	return m, tea.Batch(cmds...)
}

func (m LoginScreen) View() tea.View {
	var s strings.Builder

	s.WriteString("login screen!\n")
	s.WriteString(m.loginForm.View().Content)

	return tea.NewView(s.String())
}
