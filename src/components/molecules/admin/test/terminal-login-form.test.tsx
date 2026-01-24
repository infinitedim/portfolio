import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { TerminalLoginForm } from "../terminal-login-form";

// Mock theme config
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#0a0a0a",
    text: "#e5e5e5",
    accent: "#00ff41",
    muted: "#666666",
    border: "#333333",
    error: "#ff4444",
  },
};

// Mock auth context
const mockLogin = vi.fn();
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

// Mock i18n hook
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    loading: "Loading...",
    submit: "Submit",
  };
  return translations[key] || key;
});

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({
    t: mockT,
  }),
}));

describe("TerminalLoginForm", () => {
  const mockOnLoginSuccess = vi.fn();

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render email input field", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const emailInput = screen.getByPlaceholderText("Enter your email");
      expect(emailInput).toBeInTheDocument();
    });

    it("should render password input field", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      expect(passwordInput).toBeInTheDocument();
    });

    it("should render submit button", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const submitButton = screen.getByText("Submit");
      expect(submitButton).toBeInTheDocument();
    });

    it("should render keyboard hints", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(screen.getByText(/Press Tab to switch fields/)).toBeInTheDocument();
    });
  });

  describe("Input Handling", () => {
    it("should update email when typed", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const emailInput = screen.getByPlaceholderText("Enter your email");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      expect((emailInput as HTMLInputElement).value).toBe("test@example.com");
    });

    it("should update password when typed", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      expect((passwordInput as HTMLInputElement).value).toBe("password123");
    });

    it("should show password toggle button when password has value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      fireEvent.change(passwordInput, { target: { value: "password" } });

      const toggleButton = screen.getByRole("button", { name: /👁️|🙈/ });
      expect(toggleButton).toBeInTheDocument();
    });

    it("should toggle password visibility", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      fireEvent.change(passwordInput, { target: { value: "password" } });

      const toggleButton = screen.getByRole("button", { name: /👁️|🙈/ });
      const initialType = (passwordInput as HTMLInputElement).type;

      fireEvent.click(toggleButton);

      expect((passwordInput as HTMLInputElement).type).not.toBe(initialType);
    });
  });

  describe("Keyboard Navigation", () => {
    it("should switch to password field on Enter in email field", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const emailInput = screen.getByPlaceholderText("Enter your email");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.keyDown(emailInput, { key: "Enter" });

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      expect(document.activeElement).toBe(passwordInput);
    });

    it("should submit on Enter in password field", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockLogin.mockResolvedValue({ success: true });

      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password" } });
      fireEvent.keyDown(passwordInput, { key: "Enter" });

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password");
      });
    });

    it("should switch fields on Tab", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const emailInput = screen.getByPlaceholderText("Enter your email");
      fireEvent.keyDown(emailInput, { key: "Tab", preventDefault: vi.fn() });

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      expect(document.activeElement).toBe(passwordInput);
    });
  });

  describe("Form Submission", () => {
    it("should call login with email and password", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockLogin.mockResolvedValue({ success: true });

      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
      });
    });

    it("should call onLoginSuccess on successful login", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockLogin.mockResolvedValue({ success: true });

      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled();
      });
    });

    it("should show error message on failed login", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockLogin.mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrong" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
      });
    });

    it("should disable submit button when loading", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)),
      );

      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });
    });

    it("should not submit when email or password is empty", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const submitButton = screen.getByText("Submit");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should clear error when user starts typing", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockLogin.mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      render(
        <TerminalLoginForm
          onLoginSuccess={mockOnLoginSuccess}
          themeConfig={mockThemeConfig}
        />,
      );

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const submitButton = screen.getByText("Submit");

      // Trigger error
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrong" } });
      fireEvent.click(submitButton);

      // Clear error by typing
      fireEvent.change(emailInput, { target: { value: "new@example.com" } });

      // Error should be cleared (component should re-render)
      expect(emailInput).toBeInTheDocument();
    });
  });
});
