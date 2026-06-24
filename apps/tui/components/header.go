package components

import (
	"fmt"
	"kettou/theme"
	"kettou/types"
	"strings"

	"charm.land/lipgloss/v2"
)

func RenderHeader(user types.User) string {
	logo := `
  ▄▄▄▄   ▄▄▄
 █▀ ██  ██         █▄  █▄
    ██ ██         ▄██▄▄██▄
    █████    ▄█▀█▄ ██  ██ ▄███▄ ██ ██
    ██ ██▄   ██▄█▀ ██  ██ ██ ██ ██ ██
  ▀██▀  ▀██▄▄▀█▄▄▄▄██ ▄██▄▀███▀▄▀██▀█ `

	// 2D gradient for logo (top left - bottom right)
	lines := strings.Split(logo, "\n")
	height := len(lines)
	width := 0
	for _, line := range lines {
		l := len([]rune(line))
		if l > width {
			width = l
		}
	}

	colors := lipgloss.Blend2D(width, height, 45.0, lipgloss.Color("#E0FFFF"), lipgloss.Color("#007FFF"))

	var coloredLines []string
	for y, line := range lines {
		var coloredRunes []string
		runes := []rune(line)
		for x, r := range runes {
			colorIdx := y*width + x
			if colorIdx < len(colors) {
				styledRune := lipgloss.NewStyle().Foreground(colors[colorIdx]).Bold(true).Render(string(r))
				coloredRunes = append(coloredRunes, styledRune)
			} else {
				coloredRunes = append(coloredRunes, string(r))
			}
		}
		coloredLines = append(coloredLines, strings.Join(coloredRunes, ""))
	}
	logoBlock := strings.Join(coloredLines, "\n")

	// User info styles
	labelStyle := lipgloss.NewStyle().Foreground(theme.ColorPrimary).Bold(true)
	valueStyle := lipgloss.NewStyle()

	userNameStr := labelStyle.Render("username: ") + valueStyle.Render(user.Username)
	eloStr := labelStyle.Render("elo: ") + valueStyle.Render(fmt.Sprintf("%.0f", user.Elo))

	userInfoBlock := lipgloss.JoinVertical(lipgloss.Left, userNameStr, eloStr)

	// Add padding to align header items
	userInfoBlock = lipgloss.NewStyle().Render(userInfoBlock)

	return lipgloss.JoinHorizontal(lipgloss.Top, logoBlock, "        ", userInfoBlock)
}
