package components

import (
	"kettou/services"
	"kettou/types"
	"log"
	"strings"

	"charm.land/bubbles/v2/textinput"
	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

type InputModel struct {
	Label string
	Model textinput.Model
}

type FormModel struct {
	focusIndex int
	inputs     []InputModel
}

func NewForm(inputLabels []string) FormModel {
	numInputs := len(inputLabels)
	textInputs := make([]InputModel, numInputs)

	for i := range numInputs {
		ti := InputModel{
			Label: inputLabels[i],
			Model: textinput.New(),
		}

		// basic settings
		ti.Model.Placeholder = inputLabels[i]
		ti.Model.SetWidth(30)

		// style
		ti.Model.CharLimit = 32

		if i == 0 {
			ti.Model.Focus()
		}

		textInputs[i] = ti
	}

	return FormModel{
		inputs: textInputs,
	}
}

func (form FormModel) getValues() map[string]string {
	values := make(map[string]string)
	for i := range len(form.inputs) {
		values[form.inputs[i].Label] = form.inputs[i].Model.Value()
	}
	return values
}

func (form FormModel) Init() tea.Cmd {
	return textinput.Blink
}

func (form FormModel) Update(msg tea.Msg) (FormModel, tea.Cmd) {
	var cmds []tea.Cmd
	numInputs := len(form.inputs) + 1 // +1 for Submit button
	switch msg := msg.(type) {
	case types.ErrMsg:
		log.Printf("Error %v", msg)

	case types.LoggedInMsg:
		log.Printf("get logged in command success")

	case tea.KeyPressMsg:
		switch msg.String() {
		case "ctrl+c", "esc":
			return form, tea.Quit

		case "up", "ctrl+p", "shift+tab", "down", "ctrl+n", "tab":
			s := msg.String()
			if s == "down" || s == "ctrl+n" || s == "tab" {
				form.focusIndex = (form.focusIndex + 1) % numInputs
			} else {
				form.focusIndex = (form.focusIndex - 1 + numInputs) % numInputs
			}
			for i := range numInputs - 1 {
				var cmd tea.Cmd
				if i == form.focusIndex {
					cmd = form.inputs[i].Model.Focus()
					cmds = append(cmds, cmd)
				} else {
					form.inputs[i].Model.Blur()
				}
			}

		case "enter":
			if form.focusIndex == numInputs-1 { // is on Submit button
				formValues := form.getValues()
				log.Printf("%+v", formValues)
				user := types.LoginRequest{
					Username: formValues["username"],
					Password: formValues["password"],
				}
				return form, services.Login(user)
			}
		}

	}

	for i := range numInputs - 1 {
		var cmd tea.Cmd
		form.inputs[i].Model, cmd = form.inputs[i].Model.Update(msg)
		cmds = append(cmds, cmd)
	}

	return form, tea.Batch(cmds...)
}

func (form FormModel) View() tea.View {
	numInputs := len(form.inputs)
	var s strings.Builder
	for i := range numInputs {
		s.WriteString(form.inputs[i].Label)
		s.WriteRune('\n')
		s.WriteString(form.inputs[i].Model.View())
		s.WriteRune('\n')
	}
	buttonStyle := lipgloss.NewStyle()
	if form.focusIndex == numInputs {
		focusedButtonStyle := buttonStyle.Background(lipgloss.Color("18"))
		s.WriteString(focusedButtonStyle.Render("[Submit]"))
	} else {
		s.WriteString(buttonStyle.Render("[Submit]"))
	}
	v := tea.NewView(s.String())
	return v
}
