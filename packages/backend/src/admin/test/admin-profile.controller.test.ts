import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdminProfileController } from "../admin-profile.controller";

// Mock services
const mockAdminProfileService = {
  getProfile: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  updateUserInfo: vi.fn(),
};

const mockAllowedIpService = {
  getAllowedIps: vi.fn(),
  addAllowedIp: vi.fn(),
  updateAllowedIp: vi.fn(),
  removeAllowedIp: vi.fn(),
  getIpStats: vi.fn(),
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
      mockAllowedIpService as any,
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

  describe("getAllowedIps", () => {
    it("should get allowed IPs successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockRequest = {
        user: mockUser,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockIps = [
        { id: "ip-1", ipAddress: "192.168.1.1", description: "Home" },
        { id: "ip-2", ipAddress: "10.0.0.1", description: "Office" },
      ];

      mockAllowedIpService.getAllowedIps.mockResolvedValue(mockIps);
      mockAuditLogService.logEvent.mockResolvedValue({});

      const result = await controller.getAllowedIps(mockRequest as any);

      expect(mockAllowedIpService.getAllowedIps).toHaveBeenCalledWith(
        "user-123",
      );
      expect(mockAuditLogService.logEvent).toHaveBeenCalledWith(
        {
          eventType: "DATA_VIEWED",
          severity: "LOW",
          userId: "user-123",
          resource: "AllowedIp",
          action: "VIEW_ALLOWED_IPS",
          ipAddress: "192.168.1.1",
          userAgent: "test-agent",
        },
        mockRequest,
      );
      expect(result).toEqual(mockIps);
    });

    it("should throw error when user is not authenticated", async () => {
      const mockRequest = {
        user: null,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };

      await expect(
        controller.getAllowedIps(mockRequest as any),
      ).rejects.toThrow("User not authenticated");
    });
  });

  describe("addAllowedIp", () => {
    it("should add allowed IP successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockRequest = {
        user: mockUser,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockData = {
        ipAddress: "192.168.1.100",
        description: "New IP",
      };
      const mockAllowedIp = {
        id: "ip-3",
        adminUserId: "user-123",
        ...mockData,
      };

      mockAllowedIpService.addAllowedIp.mockResolvedValue(mockAllowedIp);
      mockAuditLogService.logEvent.mockResolvedValue({});

      const result = await controller.addAllowedIp(
        mockRequest as any,
        mockData,
      );

      expect(mockAllowedIpService.addAllowedIp).toHaveBeenCalledWith(
        "user-123",
        mockData,
      );
      expect(mockAuditLogService.logEvent).toHaveBeenCalledWith(
        {
          eventType: "DATA_CREATED",
          severity: "MEDIUM",
          userId: "user-123",
          resource: "AllowedIp",
          resourceId: "ip-3",
          action: "ADD_ALLOWED_IP",
          details: { ipAddress: "192.168.1.100" },
          ipAddress: "192.168.1.1",
          userAgent: "test-agent",
        },
        mockRequest,
      );
      expect(result).toEqual(mockAllowedIp);
    });

    it("should throw error when user is not authenticated", async () => {
      const mockRequest = {
        user: null,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockData = { ipAddress: "192.168.1.100" };

      await expect(
        controller.addAllowedIp(mockRequest as any, mockData),
      ).rejects.toThrow("User not authenticated");
    });
  });

  describe("updateAllowedIp", () => {
    it("should update allowed IP successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockRequest = {
        user: mockUser,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockData = {
        description: "Updated description",
        isActive: false,
      };
      const mockAllowedIp = {
        id: "ip-1",
        adminUserId: "user-123",
        ipAddress: "192.168.1.1",
        ...mockData,
      };

      mockAllowedIpService.updateAllowedIp.mockResolvedValue(mockAllowedIp);
      mockAuditLogService.logEvent.mockResolvedValue({});

      const result = await controller.updateAllowedIp(
        mockRequest as any,
        "ip-1",
        mockData,
      );

      expect(mockAllowedIpService.updateAllowedIp).toHaveBeenCalledWith(
        "ip-1",
        "user-123",
        mockData,
      );
      expect(mockAuditLogService.logEvent).toHaveBeenCalledWith(
        {
          eventType: "DATA_UPDATED",
          severity: "MEDIUM",
          userId: "user-123",
          resource: "AllowedIp",
          resourceId: "ip-1",
          action: "UPDATE_ALLOWED_IP",
          details: { fields: Object.keys(mockData) },
          ipAddress: "192.168.1.1",
          userAgent: "test-agent",
        },
        mockRequest,
      );
      expect(result).toEqual(mockAllowedIp);
    });

    it("should throw error when user is not authenticated", async () => {
      const mockRequest = {
        user: null,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockData = { description: "Updated description" };

      await expect(
        controller.updateAllowedIp(mockRequest as any, "ip-1", mockData),
      ).rejects.toThrow("User not authenticated");
    });
  });

  describe("removeAllowedIp", () => {
    it("should remove allowed IP successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockRequest = {
        user: mockUser,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockRemovedIp = {
        id: "ip-1",
        adminUserId: "user-123",
        ipAddress: "192.168.1.100",
      };

      mockAllowedIpService.removeAllowedIp.mockResolvedValue(mockRemovedIp);
      mockAuditLogService.logEvent.mockResolvedValue({});

      const result = await controller.removeAllowedIp(
        mockRequest as any,
        "ip-1",
      );

      expect(mockAllowedIpService.removeAllowedIp).toHaveBeenCalledWith(
        "ip-1",
        "user-123",
      );
      expect(mockAuditLogService.logEvent).toHaveBeenCalledWith(
        {
          eventType: "DATA_DELETED",
          severity: "MEDIUM",
          userId: "user-123",
          resource: "AllowedIp",
          resourceId: "ip-1",
          action: "REMOVE_ALLOWED_IP",
          details: { ipAddress: "192.168.1.100" },
          ipAddress: "192.168.1.1",
          userAgent: "test-agent",
        },
        mockRequest,
      );
      expect(result).toEqual({ message: "IP address removed successfully" });
    });

    it("should throw error when user is not authenticated", async () => {
      const mockRequest = {
        user: null,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };

      await expect(
        controller.removeAllowedIp(mockRequest as any, "ip-1"),
      ).rejects.toThrow("User not authenticated");
    });
  });

  describe("getIpStats", () => {
    it("should get IP stats successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockRequest = {
        user: mockUser,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };
      const mockStats = {
        total: 5,
        active: 3,
        recentlyUsed: 2,
      };

      mockAllowedIpService.getIpStats.mockResolvedValue(mockStats);
      mockAuditLogService.logEvent.mockResolvedValue({});

      const result = await controller.getIpStats(mockRequest as any);

      expect(mockAllowedIpService.getIpStats).toHaveBeenCalledWith("user-123");
      expect(mockAuditLogService.logEvent).toHaveBeenCalledWith(
        {
          eventType: "DATA_VIEWED",
          severity: "LOW",
          userId: "user-123",
          resource: "AllowedIp",
          action: "VIEW_IP_STATS",
          ipAddress: "192.168.1.1",
          userAgent: "test-agent",
        },
        mockRequest,
      );
      expect(result).toEqual(mockStats);
    });

    it("should throw error when user is not authenticated", async () => {
      const mockRequest = {
        user: null,
        ip: "192.168.1.1",
        headers: { "user-agent": "test-agent" },
      };

      await expect(controller.getIpStats(mockRequest as any)).rejects.toThrow(
        "User not authenticated",
      );
    });
  });
});
