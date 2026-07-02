package theme

import "charm.land/lipgloss/v2"

var (
	ColorPrimary   = lipgloss.Color("#E0FFFF") //
	ColorSecondary = lipgloss.Color("#007FFF") //
	ColorMuted     = lipgloss.Color("8")       //
)

var (
	TextMuted = lipgloss.NewStyle().Foreground(ColorMuted)
	TextBold  = lipgloss.NewStyle().Bold(true)
)
