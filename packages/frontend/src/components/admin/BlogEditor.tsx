"use client";

import { useState, useEffect, useRef } from "react";
import type { ThemeConfig } from "@portfolio/frontend/src/types/theme";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogEditorProps {
  themeConfig: ThemeConfig;
}

/**
 *
 * @param root0
 * @param root0.themeConfig
 */
export function BlogEditor({ themeConfig }: BlogEditorProps) {
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [drafts, setDrafts] = useState<BlogPost[]>([]);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Initialize with sample draft
  useEffect(() => {
    const sampleDraft: BlogPost = {
      id: "draft-1",
      title: "New Blog Post",
      slug: "new-blog-post",
      content:
        "# Welcome to the Blog Editor\n\nStart writing your content here...\n\n## Features\n\n- **Markdown Support**: Write in Markdown\n- **Live Preview**: See changes in real-time\n- **Auto-save**: Your work is automatically saved\n- **Terminal Theme**: Consistent with the admin interface\n\n## Code Example\n\n```javascript\nconsole.log('Hello, World!');\n```",
      summary: "A brief summary of your blog post",
      tags: ["blog", "markdown"],
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDrafts([sampleDraft]);
    setCurrentPost(sampleDraft);
    setTitle(sampleDraft.title);
    setContent(sampleDraft.content);
    setSummary(sampleDraft.summary);
    setTags(sampleDraft.tags);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (
        currentPost &&
        (title !== currentPost.title || content !== currentPost.content)
      ) {
        saveDraft();
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, currentPost]);

  const saveDraft = async () => {
    if (!currentPost) return;

    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedPost: BlogPost = {
      ...currentPost,
      title,
      content,
      summary,
      tags,
      updatedAt: new Date().toISOString(),
    };

    setCurrentPost(updatedPost);
    setDrafts((prev) =>
      prev.map((draft) => (draft.id === updatedPost.id ? updatedPost : draft)),
    );
    setLastSaved(new Date());
    setIsSaving(false);
  };

  const createNewDraft = () => {
    const newDraft: BlogPost = {
      id: `draft-${Date.now()}`,
      title: "Untitled Post",
      slug: "untitled-post",
      content: "# New Blog Post\n\nStart writing here...",
      summary: "",
      tags: [],
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDrafts((prev) => [newDraft, ...prev]);
    setCurrentPost(newDraft);
    setTitle(newDraft.title);
    setContent(newDraft.content);
    setSummary(newDraft.summary);
    setTags(newDraft.tags);
  };

  const loadDraft = (draft: BlogPost) => {
    setCurrentPost(draft);
    setTitle(draft.title);
    setContent(draft.content);
    setSummary(draft.summary);
    setTags(draft.tags);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const publishPost = async () => {
    if (!currentPost) return;

    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const publishedPost: BlogPost = {
      ...currentPost,
      title,
      content,
      summary,
      tags,
      published: true,
      updatedAt: new Date().toISOString(),
    };

    setCurrentPost(publishedPost);
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.id === publishedPost.id ? publishedPost : draft,
      ),
    );
    setIsSaving(false);
  };

  const renderMarkdownPreview = (markdown: string) => {
    // Simple Markdown to HTML conversion
    return markdown
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gim, "<em>$1</em>")
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, "<pre><code>$2</code></pre>")
      .replace(/`([^`]+)`/gim, "<code>$1</code>")
      .replace(/\n/gim, "<br>");
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div
        className="p-4 border rounded"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: themeConfig.colors.bg,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span
              className="text-sm font-mono"
              style={{ color: themeConfig.colors.accent }}
            >
              editor@portfolio:~$
            </span>
            <span className="text-sm opacity-70">./blog-editor.sh</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={createNewDraft}
              className="px-3 py-1 text-xs border rounded transition-colors"
              style={{
                borderColor: themeConfig.colors.accent,
                color: themeConfig.colors.accent,
              }}
            >
              ✏️ New Draft
            </button>
            <button
              onClick={saveDraft}
              disabled={isSaving}
              className="px-3 py-1 text-xs border rounded transition-colors"
              style={{
                borderColor: isSaving
                  ? themeConfig.colors.muted
                  : themeConfig.colors.success,
                color: isSaving
                  ? themeConfig.colors.muted
                  : themeConfig.colors.success,
              }}
            >
              {isSaving ? "💾 Saving..." : "💾 Save"}
            </button>
            <button
              onClick={publishPost}
              disabled={isSaving}
              className="px-3 py-1 text-xs border rounded transition-colors"
              style={{
                borderColor: isSaving
                  ? themeConfig.colors.muted
                  : themeConfig.colors.accent,
                color: isSaving
                  ? themeConfig.colors.muted
                  : themeConfig.colors.accent,
              }}
            >
              🚀 Publish
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <span>Drafts: {drafts.length}</span>
            <span>Published: {drafts.filter((d) => d.published).length}</span>
            {lastSaved && (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="px-2 py-1 border rounded transition-colors"
            style={{
              borderColor: isPreview
                ? themeConfig.colors.accent
                : themeConfig.colors.border,
              color: isPreview
                ? themeConfig.colors.accent
                : themeConfig.colors.text,
            }}
          >
            {isPreview ? "📝 Edit" : "👁️ Preview"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Drafts Sidebar */}
        <div className="lg:col-span-1">
          <div
            className="p-4 border rounded"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: themeConfig.colors.bg,
            }}
          >
            <div
              className="text-sm font-bold mb-3"
              style={{ color: themeConfig.colors.accent }}
            >
              Drafts
            </div>
            <div className="space-y-2">
              {drafts.map((draft) => {
                const conditionedClassName = `${currentPost?.id === draft.id ? "scale-105" : "hover:scale-102"}`;
                const className = `w-full p - 3 text - left border rounded transition - all duration - 200 ${conditionedClassName}`;
                return (
                  <button
                    key={draft.id}
                    onClick={() => loadDraft(draft)}
                    className={className}
                    style={{
                      borderColor:
                        currentPost?.id === draft.id
                          ? themeConfig.colors.accent
                          : themeConfig.colors.border,
                      backgroundColor:
                        currentPost?.id === draft.id
                          ? `${themeConfig.colors.accent} 20`
                          : themeConfig.colors.bg,
                    }}
                  >
                    <div className="text-xs font-mono truncate">
                      {draft.title}
                    </div>
                    <div className="text-xs opacity-50 mt-1">
                      {new Date(draft.updatedAt).toLocaleDateString()}
                    </div>
                    {draft.published && (
                      <div
                        className="text-xs mt-1"
                        style={{ color: themeConfig.colors.success }}
                      >
                        ✅ Published
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editor/Preview */}
        <div className="lg:col-span-3">
          <div
            className="p-4 border rounded"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: themeConfig.colors.bg,
            }}
          >
            {/* Title */}
            <div className="mb-4">
              <div className="text-xs opacity-70 mb-2">Title</div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded bg-transparent font-mono"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
                placeholder="Enter post title..."
              />
            </div>

            {/* Summary */}
            <div className="mb-4">
              <div className="text-xs opacity-70 mb-2">Summary</div>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded bg-transparent font-mono resize-none"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
                placeholder="Brief summary of the post..."
              />
            </div>

            {/* Tags */}
            <div className="mb-4">
              <div className="text-xs opacity-70 mb-2">Tags</div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                  className="flex-1 px-3 py-2 text-sm border rounded bg-transparent font-mono"
                  style={{
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text,
                  }}
                  placeholder="Add tag..."
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 text-xs border rounded transition-colors"
                  style={{
                    borderColor: themeConfig.colors.accent,
                    color: themeConfig.colors.accent,
                  }}
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs border rounded flex items-center space-x-1"
                    style={{
                      borderColor: themeConfig.colors.border,
                      backgroundColor: themeConfig.colors.bg,
                    }}
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="opacity-50 hover:opacity-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="text-xs opacity-70 mb-2">Content</div>
              {isPreview ? (
                <div
                  className="w-full min-h-[400px] px-3 py-2 text-sm border rounded font-mono overflow-y-auto"
                  style={{
                    borderColor: themeConfig.colors.border,
                    backgroundColor: themeConfig.colors.bg,
                    color: themeConfig.colors.text,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdownPreview(content),
                  }}
                />
              ) : (
                <textarea
                  ref={contentRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[400px] px-3 py-2 text-sm border rounded bg-transparent font-mono resize-none"
                  style={{
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text,
                  }}
                  placeholder="Write your content in Markdown..."
                />
              )}
            </div>

            {/* Markdown Help */}
            {!isPreview && (
              <div
                className="mt-4 pt-4 border-t"
                style={{ borderColor: themeConfig.colors.border }}
              >
                <div className="text-xs opacity-70 mb-2">
                  Markdown Quick Reference
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs opacity-50">
                  <div>
                    <div># Heading 1</div>
                    <div>## Heading 2</div>
                    <div>**Bold text**</div>
                    <div>*Italic text*</div>
                  </div>
                  <div>
                    <div>`code`</div>
                    <div>```javascript</div>
                    <div>console.log('code block');</div>
                    <div>```</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
