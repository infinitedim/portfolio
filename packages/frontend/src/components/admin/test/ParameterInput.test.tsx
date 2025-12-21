import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ParameterInput } from "../ParameterInput";

const mockThemeConfig = {
  name: "test-theme",
  colors: {
    bg: "#1a1a2e",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
    success: "#00ff00",
    error: "#ff0000",
    warning: "#ffff00",
    muted: "#888888",
  },
};

const mockParameters = [
  {
    name: "email",
    type: "string",
    required: true,
    description: "User email address",
  },
  {
    name: "age",
    type: "number",
    required: false,
    description: "User age",
  },
  {
    name: "isActive",
    type: "boolean",
    required: false,
    description: "Whether user is active",
  },
  {
    name: "metadata",
    type: "object",
    required: false,
    description: "Additional metadata as JSON",
  },
];

// Helper function to expand a parameter
const expandParameter = (name: string) => {
  const buttons = screen.getAllByRole("button");
  const targetButton = buttons.find((btn) => btn.textContent?.includes(name));
  if (targetButton) {
    fireEvent.click(targetButton);
  }
};

describe("ParameterInput", () => {
  it("renders all parameters", () => {
    render(
      <ParameterInput
        parameters={mockParameters}
        values={{}}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    expect(screen.getByText(/email/i)).toBeDefined();
    expect(screen.getByText(/age/i)).toBeDefined();
    expect(screen.getByText(/isActive/i)).toBeDefined();
    expect(screen.getByText(/metadata/i)).toBeDefined();
  });

  it("displays parameter descriptions when expanded", () => {
    render(
      <ParameterInput
        parameters={mockParameters}
        values={{}}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    // Expand parameters first
    expandParameter("email");
    expandParameter("age");

    expect(screen.getByText("User email address")).toBeDefined();
    expect(screen.getByText("User age")).toBeDefined();
  });

  it("renders text input for string parameters when expanded", () => {
    render(
      <ParameterInput
        parameters={mockParameters}
        values={{ email: "" }}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    // Expand the email parameter first
    expandParameter("email");

    const emailInput = screen.getByPlaceholderText(/enter email/i);
    expect(emailInput).toBeDefined();
    expect(emailInput.getAttribute("type")).toBe("text");
  });

  it("renders number input for number parameters when expanded", () => {
    render(
      <ParameterInput
        parameters={mockParameters}
        values={{ age: 0 }}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    // Expand the age parameter first
    expandParameter("age");

    const ageInput = screen.getByPlaceholderText(/enter age/i);
    expect(ageInput).toBeDefined();
    expect(ageInput.getAttribute("type")).toBe("number");
  });

  it("renders select for boolean parameters when expanded", () => {
    render(
      <ParameterInput
        parameters={mockParameters}
        values={{ isActive: false }}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    // Expand the isActive parameter first
    expandParameter("isActive");

    expect(screen.getByText("True")).toBeDefined();
    expect(screen.getByText("False")).toBeDefined();
  });

  it("renders textarea for object parameters when expanded", () => {
    render(
      <ParameterInput
        parameters={mockParameters}
        values={{ metadata: {} }}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    // Expand the metadata parameter first
    expandParameter("metadata");

    const textarea = screen.getByPlaceholderText(/enter metadata as json/i);
    expect(textarea).toBeDefined();
    expect(textarea.tagName.toLowerCase()).toBe("textarea");
  });

  it("calls onChange when string input changes", () => {
    const mockOnChange = vi.fn();

    render(
      <ParameterInput
        parameters={mockParameters}
        values={{ email: "" }}
        onChange={mockOnChange}
        themeConfig={mockThemeConfig}
      />,
    );

    // Expand the email parameter first
    expandParameter("email");

    const emailInput = screen.getByPlaceholderText(/enter email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(mockOnChange).toHaveBeenCalledWith("email", "test@example.com");
  });

  it("calls onChange when number input changes", () => {
    const mockOnChange = vi.fn();

    render(
      <ParameterInput
        parameters={mockParameters}
        values={{ age: 0 }}
        onChange={mockOnChange}
        themeConfig={mockThemeConfig}
      />,
    );

    // Expand the age parameter first
    expandParameter("age");

    const ageInput = screen.getByPlaceholderText(/enter age/i);
    fireEvent.change(ageInput, { target: { value: "25" } });

    expect(mockOnChange).toHaveBeenCalledWith("age", 25);
  });

  it("calls onChange when boolean select changes", () => {
    const mockOnChange = vi.fn();

    render(
      <ParameterInput
        parameters={mockParameters}
        values={{ isActive: false }}
        onChange={mockOnChange}
        themeConfig={mockThemeConfig}
      />,
    );

    // Expand the isActive parameter first
    expandParameter("isActive");

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "true" } });

    expect(mockOnChange).toHaveBeenCalledWith("isActive", true);
  });

  it("calls onChange with parsed JSON for object parameters", () => {
    const mockOnChange = vi.fn();

    render(
      <ParameterInput
        parameters={mockParameters}
        values={{ metadata: {} }}
        onChange={mockOnChange}
        themeConfig={mockThemeConfig}
      />,
    );

    // Expand the metadata parameter first
    expandParameter("metadata");

    const textarea = screen.getByPlaceholderText(/enter metadata as json/i);
    fireEvent.change(textarea, { target: { value: '{"key": "value"}' } });

    expect(mockOnChange).toHaveBeenCalledWith("metadata", { key: "value" });
  });

  it("calls onChange with raw string when JSON is invalid", () => {
    const mockOnChange = vi.fn();

    render(
      <ParameterInput
        parameters={mockParameters}
        values={{ metadata: {} }}
        onChange={mockOnChange}
        themeConfig={mockThemeConfig}
      />,
    );

    // Expand the metadata parameter first
    expandParameter("metadata");

    const textarea = screen.getByPlaceholderText(/enter metadata as json/i);
    fireEvent.change(textarea, { target: { value: "invalid json" } });

    expect(mockOnChange).toHaveBeenCalledWith("metadata", "invalid json");
  });

  it("shows required indicator for required parameters", () => {
    render(
      <ParameterInput
        parameters={mockParameters}
        values={{}}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    // Email is required, should have some indicator
    const requiredIndicators = screen.getAllByText(/required|\*/i);
    expect(requiredIndicators.length).toBeGreaterThan(0);
  });

  it("displays current values in inputs when expanded", () => {
    render(
      <ParameterInput
        parameters={mockParameters}
        values={{ email: "existing@email.com", age: 30 }}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    // Expand parameters first
    expandParameter("email");
    expandParameter("age");

    const emailInput = screen.getByPlaceholderText(/enter email/i) as HTMLInputElement;
    const ageInput = screen.getByPlaceholderText(/enter age/i) as HTMLInputElement;

    expect(emailInput.value).toBe("existing@email.com");
    expect(ageInput.value).toBe("30");
  });

  it("applies theme styling to parameter container", () => {
    const { container } = render(
      <ParameterInput
        parameters={mockParameters}
        values={{ email: "" }}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    // Check that parameter containers have theme styling applied
    const paramContainers = container.querySelectorAll('.border.rounded-lg');
    expect(paramContainers.length).toBeGreaterThan(0);
  });

  it("expands parameter when clicked and shows input field", () => {
    render(
      <ParameterInput
        parameters={mockParameters}
        values={{ email: "" }}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    // Initially input should not be visible
    expect(screen.queryByPlaceholderText(/enter email/i)).toBeNull();

    // Expand the email parameter
    expandParameter("email");

    // Now input should be visible
    const emailInput = screen.getByPlaceholderText(/enter email/i);
    expect(emailInput).toBeDefined();
  });

  it("renders empty state when no parameters provided", () => {
    const { container } = render(
      <ParameterInput
        parameters={[]}
        values={{}}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    const inputs = container.querySelectorAll("input, select, textarea");
    expect(inputs.length).toBe(0);
  });

  it("shows parameter type information", () => {
    render(
      <ParameterInput
        parameters={mockParameters}
        values={{}}
        onChange={vi.fn()}
        themeConfig={mockThemeConfig}
      />,
    );

    // Should display type hints
    expect(screen.getByText(/string/i)).toBeDefined();
    expect(screen.getByText(/number/i)).toBeDefined();
    expect(screen.getByText(/boolean/i)).toBeDefined();
  });
});
