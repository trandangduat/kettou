package main

import (
	"fmt"
	"mini-games-tui/components"
	"os"

	tea "charm.land/bubbletea/v2"
)

const (
	loginScreen int = iota
	mainScreen
)

type App struct {
	currentScreen int
	loginForm     components.FormModel
}

func initApp() App {
	return App{
		currentScreen: loginScreen,
		loginForm:     components.NewForm([]string{"username", "password"}),
	}
}

func (app App) Init() tea.Cmd {
	app.currentScreen = loginScreen
	// Trả về lệnh Init của form để con trỏ (cursor) bắt đầu nhấp nháy!
	return app.loginForm.Init()
}

func (app App) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyPressMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return app, tea.Quit
		case "l":
			if app.currentScreen == loginScreen {
				app.currentScreen = mainScreen
			} else {
				app.currentScreen = loginScreen
			}
		}
	}
	var cmd tea.Cmd
	app.loginForm, cmd = app.loginForm.Update(msg)
	return app, cmd
}

func (app App) View() tea.View {
	s := "You're in: "
	var c *tea.Cursor

	switch app.currentScreen {
	case loginScreen:
		s += "login screen!\n"

		// Lấy view của form, bao gồm cả nội dung và đối tượng con trỏ (cursor)
		formView := app.loginForm.View()
		s += formView.Content
		c = formView.Cursor

	case mainScreen:
		s += "main screen!"
	}

	v := tea.NewView(s)
	// Gắn con trỏ vào view chính
	v.Cursor = c
	return v
}

func main() {
	p := tea.NewProgram(initApp())

	// Khởi chạy ứng dụng
	if _, err := p.Run(); err != nil {
		fmt.Printf("There's been an error: %v\n", err)
		os.Exit(1)
	}
}
