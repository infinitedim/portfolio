import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TerminalSidebar } from "../TerminalSidebar";
import { useI18n } from "@/hooks/useI18n";

// Mock the hook
vi.mock("@/hooks/useI18n", () => ({
  useI18n: vi.fn(),
}));

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

const mockEnTranslations: Record<string, string> = {
  adminNavigation: "Navigation",
  adminAvailableCommands: "Available commands",
  adminOverview: "Overview",
  adminPerformance: "Performance",
  adminLogs: "Logs",
  adminBlogEditor: "Blog Editor",
  adminBackendTesting: "Backend Testing",
  adminSettings: "Settings",
  adminSystemStatus: "System Status",
  adminCPU: "CPU",
  adminMemory: "Memory",
  adminNetwork: "Network",
  adminDisk: "Disk",
  adminQuickCommands: "Quick Commands",
  commandRefresh: "Refresh",
  commandClear: "Clear",
  blogSaveDraft: "Save",
  adminLogout: "Quit",
};

const mockIdTranslations: Record<string, string> = {
  adminNavigation: "Navigasi",
  adminAvailableCommands: "Perintah yang tersedia",
  adminOverview: "Ringkasan",
  adminPerformance: "Performa",
  adminLogs: "Log",
  adminBlogEditor: "Editor Blog",
  adminBackendTesting: "Pengujian Backend",
  adminSettings: "Pengaturan",
  adminSystemStatus: "Status Sistem",
  adminCPU: "CPU",
  adminMemory: "Memori",
  adminNetwork: "Jaringan",
  adminDisk: "Disk",
  adminQuickCommands: "Perintah Cepat",
  commandRefresh: "Segarkan",
  commandClear: "Bersihkan",
  blogSaveDraft: "Simpan",
  adminLogout: "Keluar",
};

const mockEsTranslations: Record<string, string> = {
  adminNavigation: "Navegación",
  adminAvailableCommands: "Comandos disponibles",
  adminOverview: "Vista General",
  adminPerformance: "Rendimiento",
  adminLogs: "Registros",
  adminBlogEditor: "Editor de Blog",
  adminBackendTesting: "Pruebas de Backend",
  adminSettings: "Configuración",
  adminSystemStatus: "Estado del Sistema",
  adminCPU: "CPU",
  adminMemory: "MEM",
  adminNetwork: "RED",
  adminDisk: "DISCO",
  adminQuickCommands: "Comandos Rápidos",
  commandRefresh: "Actualizar",
  commandClear: "Limpiar",
  blogSaveDraft: "Guardar Borrador",
  adminLogout: "Cerrar Sesión",
};

describe("TerminalSidebar", () => {
  let mockT: Mock;
  let mockOnViewChange: Mock;

  beforeEach(() => {
    mockT = vi.fn((key: string) => mockEnTranslations[key] || key);
    mockOnViewChange = vi.fn();

    (useI18n as Mock).mockReturnValue({
      t: mockT,
      currentLocale: "en_US",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("i18n integration - English", () => {
    it("should render navigation header with i18n", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );
      expect(screen.getByText("Navigation")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("adminNavigation");
    });

    it("should render available commands text with i18n", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );
      expect(screen.getByText("Available commands")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("adminAvailableCommands");
    });

    it("should render all navigation items with i18n", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Performance")).toBeInTheDocument();
      expect(screen.getByText("Logs")).toBeInTheDocument();
      expect(screen.getByText("Blog Editor")).toBeInTheDocument();
      expect(screen.getByText("Backend Testing")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();

      expect(mockT).toHaveBeenCalledWith("adminOverview");
      expect(mockT).toHaveBeenCalledWith("adminPerformance");
      expect(mockT).toHaveBeenCalledWith("adminLogs");
      expect(mockT).toHaveBeenCalledWith("adminBlogEditor");
      expect(mockT).toHaveBeenCalledWith("adminBackendTesting");
      expect(mockT).toHaveBeenCalledWith("adminSettings");
    });

    it("should render system status with i18n", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(screen.getByText("System Status")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("adminSystemStatus");
    });

    it("should render quick commands with i18n", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(screen.getByText("Quick Commands")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("adminQuickCommands");
    });

    it("should render system metrics labels with i18n", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(screen.getByText("CPU:")).toBeInTheDocument();
      expect(screen.getByText("Memory:")).toBeInTheDocument();
      expect(screen.getByText("Network:")).toBeInTheDocument();
      expect(screen.getByText("Disk:")).toBeInTheDocument();

      expect(mockT).toHaveBeenCalledWith("adminCPU");
      expect(mockT).toHaveBeenCalledWith("adminMemory");
      expect(mockT).toHaveBeenCalledWith("adminNetwork");
      expect(mockT).toHaveBeenCalledWith("adminDisk");
    });
  });

  describe("i18n integration - Indonesian", () => {
    beforeEach(() => {
      mockT = vi.fn((key: string) => mockIdTranslations[key] || key);
      (useI18n as Mock).mockReturnValue({
        t: mockT,
        currentLocale: "id_ID",
      });
    });

    it("should render navigation header in Indonesian", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );
      expect(screen.getByText("Navigasi")).toBeInTheDocument();
    });

    it("should render navigation items in Indonesian", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(screen.getByText("Ringkasan")).toBeInTheDocument();
      expect(screen.getByText("Performa")).toBeInTheDocument();
      expect(screen.getByText("Log")).toBeInTheDocument();
      expect(screen.getByText("Editor Blog")).toBeInTheDocument();
      expect(screen.getByText("Pengujian Backend")).toBeInTheDocument();
      expect(screen.getByText("Pengaturan")).toBeInTheDocument();
    });

    it("should render system status in Indonesian", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );
      expect(screen.getByText("Status Sistem")).toBeInTheDocument();
    });
  });

  describe("i18n integration - Spanish", () => {
    beforeEach(() => {
      mockT = vi.fn((key: string) => mockEsTranslations[key] || key);
      (useI18n as Mock).mockReturnValue({
        t: mockT,
        currentLocale: "es_ES",
      });
    });

    it("should render navigation header in Spanish", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );
      expect(screen.getByText("Navegación")).toBeInTheDocument();
    });

    it("should render navigation items in Spanish", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(screen.getByText("Vista General")).toBeInTheDocument();
      expect(screen.getByText("Rendimiento")).toBeInTheDocument();
      expect(screen.getByText("Registros")).toBeInTheDocument();
      expect(screen.getByText("Editor de Blog")).toBeInTheDocument();
      expect(screen.getByText("Pruebas de Backend")).toBeInTheDocument();
      expect(screen.getByText("Configuración")).toBeInTheDocument();
    });

    it("should render system status in Spanish", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );
      expect(screen.getByText("Estado del Sistema")).toBeInTheDocument();
    });
  });

  describe("navigation functionality", () => {
    it("should call onViewChange when clicking navigation items", () => {
      render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );

      fireEvent.click(screen.getByText("Performance"));
      expect(mockOnViewChange).toHaveBeenCalledWith("performance");

      fireEvent.click(screen.getByText("Logs"));
      expect(mockOnViewChange).toHaveBeenCalledWith("logs");

      fireEvent.click(screen.getByText("Blog Editor"));
      expect(mockOnViewChange).toHaveBeenCalledWith("blog");
    });

    it("should highlight current view", () => {
      const { rerender } = render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );

      // Overview should be selected
      const overviewButton = screen.getByText("Overview").closest("button");
      expect(overviewButton).toHaveClass("scale-105");

      // Change to logs
      rerender(
        <TerminalSidebar
          currentView="logs"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );

      const logsButton = screen.getByText("Logs").closest("button");
      expect(logsButton).toHaveClass("scale-105");
    });
  });

  describe("theme integration", () => {
    it("should apply theme colors to the sidebar", () => {
      const { container } = render(
        <TerminalSidebar
          currentView="overview"
          onViewChange={mockOnViewChange}
          themeConfig={mockThemeConfig}
        />,
      );

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveStyle(
        `border-color: ${mockThemeConfig.colors.border}`,
      );
      expect(sidebar).toHaveStyle(
        `background-color: ${mockThemeConfig.colors.bg}`,
      );
    });
  });
});
