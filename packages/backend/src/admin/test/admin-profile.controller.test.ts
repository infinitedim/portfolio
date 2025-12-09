import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdminProfileController } from "../admin-profile.controller";

// Mock services
const mockAdminProfileService = {
  getProfile: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  updateUserInfo: vi.fn(),
};

const mockAuditLogService = {
  logEvent: vi.fn(),
};

describe("AdminProfileController", () => {
  let controller: AdminProfileController;

  beforeEach(() => {
    // Create controller instance directly with mocked dependencies
    controller = new AdminProfileController(
      mockAdminProfileService as any,
      mockAuditLogService as any,
    );

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should get admin profile successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockRequest = {
        user: mockUser,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockProfile = {
        id: "profile-123",
        adminUserId: "user-123",
        bio: "Test bio",
      };

      mockAdminProfileService.getProfile.mockResolvedValue(mockProfile);
      mockAuditLogService.logEvent.mockResolvedValue({});

      const result = await controller.getProfile(mockRequest as any);

      expect(mockAdminProfileService.getProfile).toHaveBeenCalledWith(
        "user-123",
      );
      expect(mockAuditLogService.logEvent).toHaveBeenCalledWith(
        {
          eventType: "DATA_VIEWED",
          severity: "LOW",
          userId: "user-123",
          resource: "AdminProfile",
          resourceId: "user-123",
          action: "VIEW_PROFILE",
          ipAddress: "192.168.1.1",
          userAgent: "test-agent",
        },
        mockRequest,
      );
      expect(result).toEqual(mockProfile);
    });

    it("should throw error when user is not authenticated", async () => {
      const mockRequest = {
        user: null,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };

      await expect(controller.getProfile(mockRequest as any)).rejects.toThrow(
        "User not authenticated",
      );
    });
  });

  describe("createProfile", () => {
    it("should create admin profile successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockRequest = {
        user: mockUser,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockData = {
        bio: "Test bio",
        phone: "1234567890",
        timezone: "UTC",
        language: "en",
        preferences: { theme: "dark" },
      };
      const mockProfile = {
        id: "profile-123",
        adminUserId: "user-123",
        ...mockData,
      };

      mockAdminProfileService.createProfile.mockResolvedValue(mockProfile);
      mockAuditLogService.logEvent.mockResolvedValue({});

      const result = await controller.createProfile(
        mockRequest as any,
        mockData,
      );

      expect(mockAdminProfileService.createProfile).toHaveBeenCalledWith(
        "user-123",
        mockData,
      );
      expect(mockAuditLogService.logEvent).toHaveBeenCalledWith(
        {
          eventType: "DATA_CREATED",
          severity: "MEDIUM",
          userId: "user-123",
          resource: "AdminProfile",
          resourceId: "user-123",
          action: "CREATE_PROFILE",
          details: { fields: Object.keys(mockData) },
          ipAddress: "192.168.1.1",
          userAgent: "test-agent",
        },
        mockRequest,
      );
      expect(result).toEqual(mockProfile);
    });

    it("should throw error when user is not authenticated", async () => {
      const mockRequest = {
        user: null,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockData = { bio: "Test bio" };

      await expect(
        controller.createProfile(mockRequest as any, mockData),
      ).rejects.toThrow("User not authenticated");
    });
  });

  describe("updateProfile", () => {
    it("should update admin profile successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockRequest = {
        user: mockUser,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockData = {
        bio: "Updated bio",
        phone: "0987654321",
      };
      const mockProfile = {
        id: "profile-123",
        adminUserId: "user-123",
        ...mockData,
      };

      mockAdminProfileService.updateProfile.mockResolvedValue(mockProfile);
      mockAuditLogService.logEvent.mockResolvedValue({});

      const result = await controller.updateProfile(
        mockRequest as any,
        mockData,
      );

      expect(mockAdminProfileService.updateProfile).toHaveBeenCalledWith(
        "user-123",
        mockData,
      );
      expect(mockAuditLogService.logEvent).toHaveBeenCalledWith(
        {
          eventType: "DATA_UPDATED",
          severity: "MEDIUM",
          userId: "user-123",
          resource: "AdminProfile",
          resourceId: "user-123",
          action: "UPDATE_PROFILE",
          details: { fields: Object.keys(mockData) },
          ipAddress: "192.168.1.1",
          userAgent: "test-agent",
        },
        mockRequest,
      );
      expect(result).toEqual(mockProfile);
    });

    it("should throw error when user is not authenticated", async () => {
      const mockRequest = {
        user: null,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockData = { bio: "Updated bio" };

      await expect(
        controller.updateProfile(mockRequest as any, mockData),
      ).rejects.toThrow("User not authenticated");
    });
  });

  describe("updateUserInfo", () => {
    it("should update user info successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockRequest = {
        user: mockUser,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockData = {
        firstName: "John",
        lastName: "Doe",
        avatar: "avatar.jpg",
      };
      const mockUpdatedUser = {
        id: "user-123",
        email: "john@example.com",
        ...mockData,
      };

      mockAdminProfileService.updateUserInfo.mockResolvedValue(mockUpdatedUser);
      mockAuditLogService.logEvent.mockResolvedValue({});

      const result = await controller.updateUserInfo(
        mockRequest as any,
        mockData,
      );

      expect(mockAdminProfileService.updateUserInfo).toHaveBeenCalledWith(
        "user-123",
        mockData,
      );
      expect(mockAuditLogService.logEvent).toHaveBeenCalledWith(
        {
          eventType: "DATA_UPDATED",
          severity: "MEDIUM",
          userId: "user-123",
          resource: "AdminUser",
          resourceId: "user-123",
          action: "UPDATE_USER_INFO",
          details: { fields: Object.keys(mockData) },
          ipAddress: "192.168.1.1",
          userAgent: "test-agent",
        },
        mockRequest,
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it("should throw error when user is not authenticated", async () => {
      const mockRequest = {
        user: null,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockData = { firstName: "John" };

      await expect(
        controller.updateUserInfo(mockRequest as any, mockData),
      ).rejects.toThrow("User not authenticated");
    });
  });
});
