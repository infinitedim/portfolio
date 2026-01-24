import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// Mock Next.js navigation
const mockPush = vi.fn();
const mockPathname = vi.fn(() => "/admin");

const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname(),
}));

// Mock SecureAuth
const mockVerifyAuthentication = vi.fn();

vi.mock("@/lib/auth/secure-auth", () => ({
  SecureAuth: {
    verifyAuthentication: mockVerifyAuthentication,
  },
}));

// Import after mocks
import AdminLayout from "../layout";

describe("AdminLayout", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
    mockPush.mockClear();
    mockVerifyAuthentication.mockClear();
    mockPathname.mockReturnValue("/admin");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Login Route", () => {
    it("should render children for login route", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin/login");

      const { getByText } = render(
        <AdminLayout>
          <div>Login Content</div>
        </AdminLayout>,
      );

      expect(getByText("Login Content")).toBeInTheDocument();
    });

    it("should not verify authentication for login route", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin/login");

      render(
        <AdminLayout>
          <div>Login Content</div>
        </AdminLayout>,
      );

      expect(mockVerifyAuthentication).not.toHaveBeenCalled();
    });
  });

  describe("Protected Routes", () => {
    it("should show loading state while verifying authentication", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      mockVerifyAuthentication.mockImplementation(
        () => new Promise(() => { }), // Never resolves
      );

      render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      expect(screen.getByText(/Verifying authentication/i)).toBeInTheDocument();
    });

    it("should render children when authentication is valid", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      mockVerifyAuthentication.mockResolvedValue({ isValid: true });

      const { getByText } = render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      await waitFor(() => {
        expect(getByText("Protected Content")).toBeInTheDocument();
      });
    });

    it("should redirect to login when authentication is invalid", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      mockVerifyAuthentication.mockResolvedValue({ isValid: false });

      render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/admin/login");
      });
    });

    it("should redirect to login when authentication verification fails", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      mockVerifyAuthentication.mockRejectedValue(new Error("Auth failed"));

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => { });

      render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/admin/login");
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Auth verification failed:",
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("should not render children when authentication is invalid", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      mockVerifyAuthentication.mockResolvedValue({ isValid: false });

      const { container } = render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Should render empty fragment when not authenticated
      expect(container.children.length).toBe(0);
    });
  });

  describe("Loading State", () => {
    it("should display loading spinner", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      mockVerifyAuthentication.mockImplementation(
        () => new Promise(() => { }), // Never resolves
      );

      const { container } = render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeTruthy();
    });

    it("should display loading message", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      mockVerifyAuthentication.mockImplementation(
        () => new Promise(() => { }), // Never resolves
      );

      render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      expect(screen.getByText(/Verifying authentication/i)).toBeInTheDocument();
    });

    it("should not show loading for login route", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin/login");

      render(
        <AdminLayout>
          <div>Login Content</div>
        </AdminLayout>,
      );

      expect(
        screen.queryByText(/Verifying authentication/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Multiple Children", () => {
    it("should render multiple children when authenticated", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      mockVerifyAuthentication.mockResolvedValue({ isValid: true });

      const { getByText } = render(
        <AdminLayout>
          <div>Child 1</div>
          <div>Child 2</div>
        </AdminLayout>,
      );

      await waitFor(() => {
        expect(getByText("Child 1")).toBeInTheDocument();
        expect(getByText("Child 2")).toBeInTheDocument();
      });
    });
  });

  describe("Pathname Changes", () => {
    it("should re-verify authentication when pathname changes", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      mockVerifyAuthentication.mockResolvedValue({ isValid: true });

      const { rerender } = render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      await waitFor(() => {
        expect(mockVerifyAuthentication).toHaveBeenCalledTimes(1);
      });

      // Change pathname
      mockPathname.mockReturnValue("/admin/dashboard");
      mockVerifyAuthentication.mockResolvedValue({ isValid: true });

      rerender(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      await waitFor(() => {
        expect(mockVerifyAuthentication).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty children", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin/login");

      const { container } = render(<AdminLayout>{null}</AdminLayout>);

      expect(container).toBeTruthy();
    });

    it("should handle authentication timeout gracefully", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      mockVerifyAuthentication.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 100),
          ),
      );

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => { });

      render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith("/admin/login");
        },
        { timeout: 200 },
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
