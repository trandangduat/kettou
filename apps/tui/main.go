package main

import (
	"fmt"
	"mini-games-tui/components"
	"mini-games-tui/services"
	"mini-games-tui/types"
	"os"
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

const (
	loginScreen int = iota
	mainScreen
)

type App struct {
	currentScreen int
	loginForm     components.FormModel
	currentUser   types.User
	logOutFocused bool
}

func initApp() App {
	return App{
		currentScreen: loginScreen,
		loginForm:     components.NewForm([]string{"username", "password"}),
	}
}

func (app App) Init() tea.Cmd {
	app.currentScreen = loginScreen
	var cmds []tea.Cmd
	cmds = append(cmds, services.FetchMe())
	cmds = append(cmds, app.loginForm.Init())
	return tea.Batch(cmds...)
}

func (app App) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyPressMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return app, tea.Quit
		case "enter":
			if app.currentScreen == mainScreen && app.logOutFocused {
				cmd = services.Logout()
				cmds = append(cmds, cmd)
			}

		}
	case services.LoggedInMsg:
		cmds = append(cmds, services.FetchMe())
	case services.CurrentUserMsg:
		app.currentUser = types.User(msg)
		app.currentScreen = mainScreen
		app.logOutFocused = true
	case services.LogoutMsg:
		app.currentUser = types.User{}
		app.currentScreen = loginScreen
		app.logOutFocused = false
		cmds = append(cmds, app.loginForm.Init())

	}

	if app.currentScreen == loginScreen {
		app.loginForm, cmd = app.loginForm.Update(msg)
		cmds = append(cmds, cmd)
	}

	return app, tea.Batch(cmds...)
}

func (app App) View() tea.View {
	var s strings.Builder

	s.WriteString("You're in: ")
	var c *tea.Cursor

	switch app.currentScreen {
	case loginScreen:
		s.WriteString("login screen!\n")

		// Lấy view của form, bao gồm cả nội dung và đối tượng con trỏ (cursor)
		formView := app.loginForm.View()
		s.WriteString(formView.Content)
		c = formView.Cursor

	case mainScreen:
		s.WriteString("main screen!\n")
		logOutBtnStyle := lipgloss.NewStyle()
		if app.logOutFocused == true {
			logOutBtnStyle = logOutBtnStyle.Background(lipgloss.Color("18"))
		}
		s.WriteString(logOutBtnStyle.Render("[Logout]"))

	}

	v := tea.NewView(s.String())
	// Gắn con trỏ vào view chính
	v.Cursor = c
	return v
}

func main() {
	// logging
	f, err := tea.LogToFile("debug.log", "debug")
	if err != nil {
		fmt.Println("fatal: ", err)
		os.Exit(1)
	}
	defer f.Close()

	// init and run program
	p := tea.NewProgram(initApp())
	if _, err := p.Run(); err != nil {
		fmt.Printf("There's been an error: %v\n", err)
		os.Exit(1)
	}
}
