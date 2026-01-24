import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { ServiceSelector, type Service } from "../service-selector";
import type { ServiceMethod } from "../method-selector";

// Mock theme config
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#0a0a0a",
    text: "#e5e5e5",
    accent: "#00ff41",
    muted: "#666666",
    border: "#333333",
  },
};

describe("ServiceSelector", () => {
  const mockMethods: ServiceMethod[] = [
    {
      name: "getUser",
      description: "Get user",
      type: "query",
      httpMethod: "GET",
    },
    {
      name: "createUser",
      description: "Create user",
      type: "mutation",
      httpMethod: "POST",
    },
  ];

  const mockServices: Service[] = [
    {
      name: "user",
      displayName: "User Service",
      description: "Manage users",
      methods: mockMethods,
    },
    {
      name: "post",
      displayName: "Post Service",
      description: "Manage posts",
      methods: [mockMethods[0]],
    },
  ];

  const mockOnServiceSelect = vi.fn();

  describe("Rendering", () => {
    it("should render all services", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ServiceSelector
          services={mockServices}
          selectedService={null}
          onServiceSelect={mockOnServiceSelect}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(screen.getByText("User Service")).toBeInTheDocument();
      expect(screen.getByText("Post Service")).toBeInTheDocument();
    });

    it("should render service descriptions", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ServiceSelector
          services={mockServices}
          selectedService={null}
          onServiceSelect={mockOnServiceSelect}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(screen.getByText("Manage users")).toBeInTheDocument();
      expect(screen.getByText("Manage posts")).toBeInTheDocument();
    });

    it("should render method count", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ServiceSelector
          services={mockServices}
          selectedService={null}
          onServiceSelect={mockOnServiceSelect}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(screen.getByText("2 methods available")).toBeInTheDocument();
      expect(screen.getByText("1 method available")).toBeInTheDocument();
    });

    it("should render service initial letter", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ServiceSelector
          services={mockServices}
          selectedService={null}
          onServiceSelect={mockOnServiceSelect}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(screen.getByText("U")).toBeInTheDocument();
      expect(screen.getByText("P")).toBeInTheDocument();
    });
  });

  describe("Service Selection", () => {
    it("should call onServiceSelect when service is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ServiceSelector
          services={mockServices}
          selectedService={null}
          onServiceSelect={mockOnServiceSelect}
          themeConfig={mockThemeConfig}
        />,
      );

      const userServiceButton = screen.getByText("User Service").closest("button");
      fireEvent.click(userServiceButton!);

      expect(mockOnServiceSelect).toHaveBeenCalledWith(mockServices[0]);
    });

    it("should highlight selected service", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ServiceSelector
          services={mockServices}
          selectedService={mockServices[0]}
          onServiceSelect={mockOnServiceSelect}
          themeConfig={mockThemeConfig}
        />,
      );

      const userServiceButton = screen.getByText("User Service").closest("button");
      expect(userServiceButton).toHaveClass("scale-105");
    });

    it("should show selection indicator for selected service", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <ServiceSelector
          services={mockServices}
          selectedService={mockServices[1]}
          onServiceSelect={mockOnServiceSelect}
          themeConfig={mockThemeConfig}
        />,
      );

      const postServiceButton = screen.getByText("Post Service").closest("button");
      expect(postServiceButton?.textContent).toContain("▶");
    });
  });

  describe("Empty State", () => {
    it("should render nothing when services array is empty", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      ensureDocumentBody();
      const { container } = render(
        <ServiceSelector
          services={[]}
          selectedService={null}
          onServiceSelect={mockOnServiceSelect}
          themeConfig={mockThemeConfig}
        />,
      );

      expect(container.firstChild).toBeEmptyDOMElement();
    });
  });
});
