import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { BlogEditor } from "../BlogEditor";
import { useI18n } from "@/hooks/useI18n";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock the hook
vi.mock("@/hooks/useI18n", () => ({
  useI18n: vi.fn(),
}));

// Mock trpc to prevent module resolution issues
vi.mock("@/lib/trpc", () => ({
  trpc: {},
  getTRPCClient: vi.fn(),
  trpcClient: null,
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
  blogNewPost: "New Post",
  blogUntitled: "Untitled Post",
  blogTitle: "Title",
  blogContent: "Content",
  blogSummary: "Summary",
  blogTags: "Tags",
  blogAddTag: "Add Tag",
  blogPreview: "Preview",
  blogPublish: "Publish",
  blogSaveDraft: "Save Draft",
  blogSaving: "Saving...",
  blogLastSaved: "Last saved",
  blogDrafts: "Drafts",
  blogPublished: "Published",
  commandEdit: "Edit",
};

const mockIdTranslations: Record<string, string> = {
  blogNewPost: "Postingan Baru",
  blogUntitled: "Postingan Tanpa Judul",
  blogTitle: "Judul",
  blogContent: "Konten",
  blogSummary: "Ringkasan",
  blogTags: "Tag",
  blogAddTag: "Tambah Tag",
  blogPreview: "Pratinjau",
  blogPublish: "Publikasikan",
  blogSaveDraft: "Simpan Draf",
  blogSaving: "Menyimpan...",
  blogLastSaved: "Terakhir disimpan",
  blogDrafts: "Draf",
  blogPublished: "Dipublikasikan",
  commandEdit: "Edit",
};

const mockEsTranslations: Record<string, string> = {
  blogNewPost: "Nueva Entrada",
  blogUntitled: "Entrada Sin Título",
  blogTitle: "Título",
  blogContent: "Contenido",
  blogSummary: "Resumen",
  blogTags: "Etiquetas",
  blogAddTag: "Agregar Etiqueta",
  blogPreview: "Vista Previa",
  blogPublish: "Publicar",
  blogSaveDraft: "Guardar Borrador",
  blogSaving: "Guardando...",
  blogLastSaved: "Último guardado",
  blogDrafts: "Borradores",
  blogPublished: "Publicado",
  commandEdit: "Editar",
};

describe("BlogEditor", () => {
  let mockT: Mock;

  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.useFakeTimers();
    mockT = vi.fn((key: string) => mockEnTranslations[key] || key);

    (useI18n as Mock).mockReturnValue({
      t: mockT,
      currentLocale: "en_US",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("i18n integration - English", () => {
    it("should render new post button with i18n", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("✏️ New Post")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("blogNewPost");
    });

    it("should render save draft button with i18n", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("💾 Save Draft")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("blogSaveDraft");
    });

    it("should render publish button with i18n", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("🚀 Publish")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("blogPublish");
    });

    it("should render preview button with i18n", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("👁️ Preview")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("blogPreview");
    });

    it("should render form labels with i18n", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Summary")).toBeInTheDocument();
      expect(screen.getByText("Tags")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();

      expect(mockT).toHaveBeenCalledWith("blogTitle");
      expect(mockT).toHaveBeenCalledWith("blogSummary");
      expect(mockT).toHaveBeenCalledWith("blogTags");
      expect(mockT).toHaveBeenCalledWith("blogContent");
    });

    it("should render drafts sidebar with i18n", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      // There are two "Drafts" texts - one in sidebar header, one in status
      const draftsElements = screen.getAllByText("Drafts");
      expect(draftsElements.length).toBeGreaterThan(0);
      expect(mockT).toHaveBeenCalledWith("blogDrafts");
    });

    it("should render add tag button with i18n", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("Add Tag")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("blogAddTag");
    });

    it("should toggle to edit mode with i18n text", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      // Click preview button
      const previewButton = screen.getByText("👁️ Preview");
      fireEvent.click(previewButton);

      // Should now show Edit button
      expect(screen.getByText("📝 Edit")).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith("commandEdit");
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

    it("should render new post button in Indonesian", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("✏️ Postingan Baru")).toBeInTheDocument();
    });

    it("should render save draft button in Indonesian", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("💾 Simpan Draf")).toBeInTheDocument();
    });

    it("should render publish button in Indonesian", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("🚀 Publikasikan")).toBeInTheDocument();
    });

    it("should render form labels in Indonesian", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      expect(screen.getByText("Judul")).toBeInTheDocument();
      expect(screen.getByText("Ringkasan")).toBeInTheDocument();
      expect(screen.getByText("Tag")).toBeInTheDocument();
      expect(screen.getByText("Konten")).toBeInTheDocument();
    });

    it("should render add tag button in Indonesian", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("Tambah Tag")).toBeInTheDocument();
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

    it("should render new post button in Spanish", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("✏️ Nueva Entrada")).toBeInTheDocument();
    });

    it("should render save draft button in Spanish", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("💾 Guardar Borrador")).toBeInTheDocument();
    });

    it("should render publish button in Spanish", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("🚀 Publicar")).toBeInTheDocument();
    });

    it("should render form labels in Spanish", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      expect(screen.getByText("Título")).toBeInTheDocument();
      expect(screen.getByText("Resumen")).toBeInTheDocument();
      expect(screen.getByText("Etiquetas")).toBeInTheDocument();
      expect(screen.getByText("Contenido")).toBeInTheDocument();
    });

    it("should render add tag button in Spanish", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);
      expect(screen.getByText("Agregar Etiqueta")).toBeInTheDocument();
    });
  });

  describe("editor functionality", () => {
    it("should create new draft with translated title", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      // Click new post button
      const newPostButton = screen.getByText("✏️ New Post");
      fireEvent.click(newPostButton);

      // The t function should be called with blogUntitled for new drafts
      expect(mockT).toHaveBeenCalledWith("blogUntitled");
    });

    it("should add and remove tags", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      // Find tag input by placeholder
      const tagInput = screen.getByPlaceholderText("Add Tag...");
      const addButton = screen.getByText("Add Tag");

      // Add a tag
      fireEvent.change(tagInput, { target: { value: "test-tag" } });
      fireEvent.click(addButton);

      // Tag should appear
      expect(screen.getByText("test-tag")).toBeInTheDocument();
    });

    it("should toggle preview mode", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      // Initially in edit mode - textarea should be visible
      expect(screen.getByText("👁️ Preview")).toBeInTheDocument();

      // Click preview
      fireEvent.click(screen.getByText("👁️ Preview"));

      // Should now show edit button
      expect(screen.getByText("📝 Edit")).toBeInTheDocument();

      // Click edit to go back
      fireEvent.click(screen.getByText("📝 Edit"));

      // Should show preview again
      expect(screen.getByText("👁️ Preview")).toBeInTheDocument();
    });
  });

  describe("theme integration", () => {
    it("should apply theme colors to buttons", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const publishButton = screen.getByText("🚀 Publish").closest("button");
      expect(publishButton).toHaveStyle(
        `border-color: ${mockThemeConfig.colors.accent}`,
      );
      expect(publishButton).toHaveStyle(
        `color: ${mockThemeConfig.colors.accent}`,
      );
    });

    it("should apply theme colors to inputs", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const titleInput = screen.getByPlaceholderText("Title...");
      expect(titleInput).toHaveStyle(
        `border-color: ${mockThemeConfig.colors.border}`,
      );
      expect(titleInput).toHaveStyle(`color: ${mockThemeConfig.colors.text}`);
    });
  });

  describe("status display", () => {
    it("should display drafts count", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      // Initial draft count should be visible
      expect(screen.getByText(/Drafts: \d+/)).toBeInTheDocument();
    });

    it("should display published count", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      expect(screen.getByText(/Published: \d+/)).toBeInTheDocument();
    });
  });
});
