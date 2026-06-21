package components

import (
	"strings"

	"charm.land/bubbles/v2/textinput"
	tea "charm.land/bubbletea/v2"
)

type FormModel struct {
	focusIndex int
	inputs     []textinput.Model
}

func NewForm(inputLabels []string) FormModel {
	numInputs := len(inputLabels)
	textInputs := make([]textinput.Model, numInputs)

	for i := range numInputs {
		ti := textinput.New()

		// basic settings
		ti.Placeholder = inputLabels[i]
		ti.SetWidth(30)

		// style
		ti.CharLimit = 32

		if i == 0 {
			ti.Focus()
		}

		textInputs[i] = ti
	}

	return FormModel{
		inputs: textInputs,
	}
}

func (form FormModel) Init() tea.Cmd {
	return textinput.Blink
}

func (form FormModel) Update(msg tea.Msg) (FormModel, tea.Cmd) {
	var cmds []tea.Cmd
	numInputs := len(form.inputs)
	switch msg := msg.(type) {
	case tea.KeyPressMsg:
		switch msg.String() {
		case "ctrl+c", "esc":
			return form, tea.Quit

		case "down", "ctrl+n", "tab":
			form.inputs[form.focusIndex].Blur()
			form.focusIndex = (form.focusIndex + 1) % numInputs

			cmd := form.inputs[form.focusIndex].Focus()
			cmds = append(cmds, cmd)

		case "up", "ctrl+p", "shift+tab":
			form.inputs[form.focusIndex].Blur()
			form.focusIndex = (form.focusIndex - 1 + numInputs) % numInputs

			cmd := form.inputs[form.focusIndex].Focus()
			cmds = append(cmds, cmd)
		}
	}

	for i := range numInputs {
		var cmd tea.Cmd
		form.inputs[i], cmd = form.inputs[i].Update(msg)
		cmds = append(cmds, cmd)
	}

	return form, tea.Batch(cmds...)
}

func (form FormModel) View() tea.View {
	var s strings.Builder

	numInputs := len(form.inputs)
	for i := range numInputs {
		s.WriteString(form.inputs[i].Placeholder)
		s.WriteString("\n")
		s.WriteString(form.inputs[i].View())
		s.WriteString("\n")
	}
	v := tea.NewView(s.String())
	return v
}
