package main

import (
	"fmt"
	"kettou/screens"
	"kettou/services"
	"kettou/types"
	"os"
	"strings"

	tea "charm.land/bubbletea/v2"
)

type App struct {
	currentScreen tea.Model
	currentUser   types.User
}

func initApp() App {
	return App{
		currentScreen: screens.InitLoginScreen(),
	}
}

func (app App) Init() tea.Cmd {
	var cmds []tea.Cmd
	cmds = append(cmds, services.FetchMe())
	cmds = append(cmds, app.currentScreen.Init())
	return tea.Batch(cmds...)
}

func (app App) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	var cmd tea.Cmd

	app.currentScreen, cmd = app.currentScreen.Update(msg)
	cmds = append(cmds, cmd)

	switch msg := msg.(type) {
	case tea.KeyPressMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return app, tea.Quit
		}
	case services.LoggedInMsg:
		cmd = services.FetchMe()
		cmds = append(cmds, cmd)
	case services.CurrentUserMsg:
		app.currentUser = types.User(msg)
		app.currentScreen = screens.InitHomeScreen(app.currentUser)
	case services.LogoutMsg:
		app.currentUser = types.User{}
		app.currentScreen = screens.InitLoginScreen()
	}

	return app, tea.Batch(cmds...)
}

func (app App) View() tea.View {
	var s strings.Builder

	s.WriteString(app.currentScreen.View().Content)

	var c *tea.Cursor
	v := tea.NewView(s.String())
	// Gắn con trỏ vào view chính
	v.Cursor = c
	v.AltScreen = true
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
