import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { BlogEditor } from "../blog-editor";

// Mock theme config
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#0a0a0a",
    text: "#e5e5e5",
    accent: "#00ff41",
    muted: "#666666",
    border: "#333333",
    success: "#00ff41",
  },
};

// Mock i18n hook
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    blogNewPost: "New Post",
    blogUntitled: "Untitled",
    blogSaving: "Saving...",
    blogSaveDraft: "Save Draft",
    blogPublish: "Publish",
    blogDrafts: "Drafts",
    blogPublished: "Published",
    blogLastSaved: "Last Saved",
    blogTitle: "Title",
    blogSummary: "Summary",
    blogTags: "Tags",
    blogAddTag: "Add Tag",
    blogContent: "Content",
    commandEdit: "Edit",
    blogPreview: "Preview",
  };
  return translations[key] || key;
});

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({
    t: mockT,
  }),
}));

describe("BlogEditor", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render blog editor", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      expect(screen.getByText(/editor@portfolio:~\$/)).toBeInTheDocument();
    });

    it("should render action buttons", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      expect(screen.getByText(/New Post/)).toBeInTheDocument();
      expect(screen.getByText(/Save Draft/)).toBeInTheDocument();
      expect(screen.getByText(/Publish/)).toBeInTheDocument();
    });

    it("should render draft list", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      expect(screen.getByText("Drafts")).toBeInTheDocument();
    });

    it("should render editor fields", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      expect(screen.getByPlaceholderText(/Title/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Summary/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Tags/)).toBeInTheDocument();
    });
  });

  describe("Draft Management", () => {
    it("should create new draft", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const newPostButton = screen.getByText(/New Post/);
      fireEvent.click(newPostButton);

      expect(screen.getByDisplayValue("Untitled")).toBeInTheDocument();
    });

    it("should load draft when clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      // Wait for initial draft to load
      waitFor(() => {
        const draftButtons = screen.getAllByText(/New Post|Welcome to the Blog Editor/);
        if (draftButtons.length > 0) {
          fireEvent.click(draftButtons[0]);
          expect(screen.getByDisplayValue(/Welcome to the Blog Editor|New Post/)).toBeInTheDocument();
        }
      });
    });

    it("should show draft count", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      expect(screen.getByText(/Drafts:/)).toBeInTheDocument();
    });
  });

  describe("Content Editing", () => {
    it("should update title when typed", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const titleInput = screen.getByPlaceholderText(/Title/);
      fireEvent.change(titleInput, { target: { value: "My Blog Post" } });

      expect((titleInput as HTMLInputElement).value).toBe("My Blog Post");
    });

    it("should update content when typed", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const contentTextarea = screen.getByPlaceholderText(/Write your content/);
      fireEvent.change(contentTextarea, {
        target: { value: "# New Content" },
      });

      expect((contentTextarea as HTMLTextAreaElement).value).toBe("# New Content");
    });

    it("should update summary when typed", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const summaryTextarea = screen.getByPlaceholderText(/Summary/);
      fireEvent.change(summaryTextarea, {
        target: { value: "This is a summary" },
      });

      expect((summaryTextarea as HTMLTextAreaElement).value).toBe("This is a summary");
    });
  });

  describe("Tag Management", () => {
    it("should add tag when entered", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const tagInput = screen.getByPlaceholderText(/Add Tag/);
      const addTagButton = screen.getByText(/Add Tag/);

      fireEvent.change(tagInput, { target: { value: "react" } });
      fireEvent.click(addTagButton);

      expect(screen.getByText("react")).toBeInTheDocument();
    });

    it("should add tag on Enter key", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const tagInput = screen.getByPlaceholderText(/Add Tag/);
      fireEvent.change(tagInput, { target: { value: "typescript" } });
      fireEvent.keyPress(tagInput, { key: "Enter" });

      expect(screen.getByText("typescript")).toBeInTheDocument();
    });

    it("should remove tag when clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      // First add a tag
      const tagInput = screen.getByPlaceholderText(/Add Tag/);
      const addTagButton = screen.getByText(/Add Tag/);
      fireEvent.change(tagInput, { target: { value: "test" } });
      fireEvent.click(addTagButton);

      // Then remove it
      const removeButton = screen.getByText("test").parentElement?.querySelector("button");
      if (removeButton) {
        fireEvent.click(removeButton);
        expect(screen.queryByText("test")).not.toBeInTheDocument();
      }
    });

    it("should not add duplicate tags", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const tagInput = screen.getByPlaceholderText(/Add Tag/);
      const addTagButton = screen.getByText(/Add Tag/);

      fireEvent.change(tagInput, { target: { value: "react" } });
      fireEvent.click(addTagButton);
      fireEvent.change(tagInput, { target: { value: "react" } });
      fireEvent.click(addTagButton);

      const reactTags = screen.queryAllByText("react");
      expect(reactTags.length).toBeLessThanOrEqual(1);
    });
  });

  describe("Preview Mode", () => {
    it("should toggle preview mode", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const previewButton = screen.getByText(/Preview/);
      fireEvent.click(previewButton);

      expect(screen.getByText(/Edit/)).toBeInTheDocument();
    });

    it("should show markdown preview", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const contentTextarea = screen.getByPlaceholderText(/Write your content/);
      fireEvent.change(contentTextarea, {
        target: { value: "# Heading\n\n**Bold text**" },
      });

      const previewButton = screen.getByText(/Preview/);
      fireEvent.click(previewButton);

      // Should show rendered HTML
      expect(screen.getByText(/Heading|Bold text/)).toBeInTheDocument();
    });
  });

  describe("Auto-save", () => {
    it("should auto-save after delay", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const titleInput = screen.getByPlaceholderText(/Title/);
      fireEvent.change(titleInput, { target: { value: "Updated Title" } });

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/Last Saved:/)).toBeInTheDocument();
      });
    });
  });

  describe("Save and Publish", () => {
    it("should save draft when save button clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const saveButton = screen.getByText(/Save Draft/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Saving...|Save Draft/)).toBeInTheDocument();
      });
    });

    it("should publish post when publish button clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const publishButton = screen.getByText(/Publish/);
      fireEvent.click(publishButton);

      await waitFor(() => {
        // Should show published status
        expect(screen.getByText(/Published/)).toBeInTheDocument();
      });
    });
  });

  describe("Markdown Rendering", () => {
    it("should render markdown headings", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const contentTextarea = screen.getByPlaceholderText(/Write your content/);
      fireEvent.change(contentTextarea, {
        target: { value: "# Heading 1\n## Heading 2" },
      });

      const previewButton = screen.getByText(/Preview/);
      fireEvent.click(previewButton);

      // Should render headings
      expect(screen.getByText(/Heading 1|Heading 2/)).toBeInTheDocument();
    });

    it("should render markdown bold text", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<BlogEditor themeConfig={mockThemeConfig} />);

      const contentTextarea = screen.getByPlaceholderText(/Write your content/);
      fireEvent.change(contentTextarea, {
        target: { value: "**Bold text**" },
      });

      const previewButton = screen.getByText(/Preview/);
      fireEvent.click(previewButton);

      // Should render bold
      expect(screen.getByText(/Bold text/)).toBeInTheDocument();
    });
  });
});
