package main

import (
	"fmt"
	"kettou/components"
	"kettou/screens"
	"kettou/services"
	"kettou/types"
	"os"
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

func (app *App) GetCurrentScreen() *tea.Model {
	if len(app.screensStack) == 0 {
		return nil
	}
	return &app.screensStack[len(app.screensStack)-1]
}

func (app *App) PushScreen(screen tea.Model) {
	app.screensStack = append(app.screensStack, screen)
}

func (app *App) PopScreen() {
	if len(app.screensStack) <= 1 {
		return
	}
	app.screensStack = app.screensStack[:len(app.screensStack)-1]
}

type App struct {
	currentUser  types.User
	screensStack []tea.Model
}

func initApp() App {
	return App{
		screensStack: []tea.Model{screens.InitLoginScreen()},
	}
}

func (app App) Init() tea.Cmd {
	var cmds []tea.Cmd
	cmds = append(cmds, services.FetchMe())
	cmds = append(cmds, app.screensStack[len(app.screensStack)-1].Init())
	return tea.Batch(cmds...)
}

func (app App) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	var cmd tea.Cmd

	currentScreen := app.GetCurrentScreen()
	if currentScreen == nil {
		return app, nil
	}

	*currentScreen, cmd = (*currentScreen).Update(msg)
	cmds = append(cmds, cmd)

	switch msg := msg.(type) {
	case tea.KeyPressMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return app, tea.Quit
		}
	case types.LoggedInMsg:
		cmd = services.FetchMe()
		cmds = append(cmds, cmd)
	case types.CurrentUserMsg:
		app.currentUser = types.User(msg)
		cmd = func() tea.Msg {
			return types.PushScreenMsg(screens.InitHomeScreen(app.currentUser))
		}
		cmds = append(cmds, cmd)

		go services.ConnectSocket()
		cmd = services.WaitForSocketMsg()
		cmds = append(cmds, cmd)
	case types.LogoutMsg:
		app.currentUser = types.User{}
		cmd = func() tea.Msg {
			return types.PushScreenMsg(screens.InitLoginScreen())
		}
		cmds = append(cmds, cmd)
	case types.PushScreenMsg:
		app.PushScreen(msg.(tea.Model))
		cmd = msg.(tea.Model).Init()
		cmds = append(cmds, cmd)
	case types.PopScreenMsg:
		app.PopScreen()
		cmd = (*app.GetCurrentScreen()).Init()
		cmds = append(cmds, cmd)
	case types.SocketEventMsg:
		cmd = services.WaitForSocketMsg()
		cmds = append(cmds, cmd)
	}

	return app, tea.Batch(cmds...)
}

func (app App) View() tea.View {
	var s strings.Builder

	currentScreen := app.GetCurrentScreen()
	content := (*currentScreen).View().Content

	if app.currentUser.Username != "" {
		header := components.RenderHeader(app.currentUser)
		layout := lipgloss.JoinVertical(lipgloss.Center, header, "\n\n", content)
		container := lipgloss.NewStyle().Padding(0, 4).Render(layout)
		s.WriteString(container)
	} else {
		s.WriteString(content)
	}

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
