import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdminProfileService } from "../admin-profile.service";
import { NotFoundException } from "@nestjs/common";

// Mock PrismaService
const mockPrismaService = {
  adminProfile: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  adminUser: {
    update: vi.fn(),
  },
};

describe("AdminProfileService", () => {
  let service: AdminProfileService;

  beforeEach(() => {
    // Create service instance directly with mocked dependencies
    service = new AdminProfileService(mockPrismaService as any);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should get admin profile successfully", async () => {
      const adminUserId = "user-123";
      const mockProfile = {
        id: "profile-123",
        adminUserId,
        bio: "Test bio",
        phone: "1234567890",
        timezone: "UTC",
        language: "en",
        preferences: { theme: "dark" },
        adminUser: {
          id: "user-123",
          email: "admin@example.com",
          firstName: "John",
          lastName: "Doe",
          avatar: "avatar.jpg",
          role: "ADMIN",
          isActive: true,
          lastLoginAt: new Date(),
        },
      };

      mockPrismaService.adminProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile(adminUserId);

      expect(mockPrismaService.adminProfile.findUnique).toHaveBeenCalledWith({
        where: { adminUserId },
        include: {
          adminUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
              isActive: true,
              lastLoginAt: true,
            },
          },
        },
      });
      expect(result).toEqual(mockProfile);
    });

    it("should throw NotFoundException when profile not found", async () => {
      const adminUserId = "user-123";

      mockPrismaService.adminProfile.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(adminUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.adminProfile.findUnique).toHaveBeenCalledWith({
        where: { adminUserId },
        include: {
          adminUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
              isActive: true,
              lastLoginAt: true,
            },
          },
        },
      });
    });
  });

  describe("createProfile", () => {
    it("should create admin profile successfully", async () => {
      const adminUserId = "user-123";
      const mockData = {
        bio: "Test bio",
        phone: "1234567890",
        timezone: "UTC",
        language: "en",
        preferences: { theme: "dark" },
      };
      const mockCreatedProfile = {
        id: "profile-123",
        adminUserId,
        ...mockData,
        adminUser: {
          id: "user-123",
          email: "admin@example.com",
          firstName: "John",
          lastName: "Doe",
          avatar: "avatar.jpg",
          role: "ADMIN",
        },
      };

      mockPrismaService.adminProfile.create.mockResolvedValue(
        mockCreatedProfile,
      );

      const result = await service.createProfile(adminUserId, mockData);

      expect(mockPrismaService.adminProfile.create).toHaveBeenCalledWith({
        data: {
          adminUserId,
          ...mockData,
        },
        include: {
          adminUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
        },
      });
      expect(result).toEqual(mockCreatedProfile);
    });

    it("should create profile with minimal data", async () => {
      const adminUserId = "user-123";
      const mockData = {
        bio: "Test bio",
      };
      const mockCreatedProfile = {
        id: "profile-123",
        adminUserId,
        ...mockData,
        adminUser: {
          id: "user-123",
          email: "admin@example.com",
          firstName: "John",
          lastName: "Doe",
          avatar: "avatar.jpg",
          role: "ADMIN",
        },
      };

      mockPrismaService.adminProfile.create.mockResolvedValue(
        mockCreatedProfile,
      );

      const result = await service.createProfile(adminUserId, mockData);

      expect(mockPrismaService.adminProfile.create).toHaveBeenCalledWith({
        data: {
          adminUserId,
          ...mockData,
        },
        include: {
          adminUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
        },
      });
      expect(result).toEqual(mockCreatedProfile);
    });
  });

  describe("updateProfile", () => {
    it("should update admin profile successfully", async () => {
      const adminUserId = "user-123";
      const mockData = {
        bio: "Updated bio",
        phone: "0987654321",
        timezone: "EST",
        language: "es",
        preferences: { theme: "light" },
      };
      const mockExistingProfile = {
        id: "profile-123",
        adminUserId,
        bio: "Old bio",
        phone: "1234567890",
      };
      const mockUpdatedProfile = {
        id: "profile-123",
        adminUserId,
        ...mockData,
        adminUser: {
          id: "user-123",
          email: "admin@example.com",
          firstName: "John",
          lastName: "Doe",
          avatar: "avatar.jpg",
          role: "ADMIN",
        },
      };

      mockPrismaService.adminProfile.findUnique.mockResolvedValue(
        mockExistingProfile,
      );
      mockPrismaService.adminProfile.update.mockResolvedValue(
        mockUpdatedProfile,
      );

      const result = await service.updateProfile(adminUserId, mockData);

      expect(mockPrismaService.adminProfile.findUnique).toHaveBeenCalledWith({
        where: { adminUserId },
      });
      expect(mockPrismaService.adminProfile.update).toHaveBeenCalledWith({
        where: { adminUserId },
        data: mockData,
        include: {
          adminUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUpdatedProfile);
    });

    it("should throw NotFoundException when profile not found", async () => {
      const adminUserId = "user-123";
      const mockData = {
        bio: "Updated bio",
      };

      mockPrismaService.adminProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(adminUserId, mockData),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.adminProfile.findUnique).toHaveBeenCalledWith({
        where: { adminUserId },
      });
      expect(mockPrismaService.adminProfile.update).not.toHaveBeenCalled();
    });

    it("should update profile with partial data", async () => {
      const adminUserId = "user-123";
      const mockData = {
        bio: "Updated bio",
      };
      const mockExistingProfile = {
        id: "profile-123",
        adminUserId,
        bio: "Old bio",
        phone: "1234567890",
      };
      const mockUpdatedProfile = {
        id: "profile-123",
        adminUserId,
        bio: "Updated bio",
        phone: "1234567890",
        adminUser: {
          id: "user-123",
          email: "admin@example.com",
          firstName: "John",
          lastName: "Doe",
          avatar: "avatar.jpg",
          role: "ADMIN",
        },
      };

      mockPrismaService.adminProfile.findUnique.mockResolvedValue(
        mockExistingProfile,
      );
      mockPrismaService.adminProfile.update.mockResolvedValue(
        mockUpdatedProfile,
      );

      const result = await service.updateProfile(adminUserId, mockData);

      expect(mockPrismaService.adminProfile.update).toHaveBeenCalledWith({
        where: { adminUserId },
        data: mockData,
        include: {
          adminUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUpdatedProfile);
    });
  });

  describe("updateUserInfo", () => {
    it("should update user info successfully", async () => {
      const adminUserId = "user-123";
      const mockData = {
        firstName: "Jane",
        lastName: "Smith",
        avatar: "new-avatar.jpg",
      };
      const mockUpdatedUser = {
        id: "user-123",
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Smith",
        avatar: "new-avatar.jpg",
        role: "ADMIN",
        isActive: true,
        lastLoginAt: new Date(),
        profile: {
          id: "profile-123",
          bio: "Test bio",
        },
      };

      mockPrismaService.adminUser.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateUserInfo(adminUserId, mockData);

      expect(mockPrismaService.adminUser.update).toHaveBeenCalledWith({
        where: { id: adminUserId },
        data: mockData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          profile: true,
        },
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it("should update user info with partial data", async () => {
      const adminUserId = "user-123";
      const mockData = {
        firstName: "Jane",
      };
      const mockUpdatedUser = {
        id: "user-123",
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Doe",
        avatar: "avatar.jpg",
        role: "ADMIN",
        isActive: true,
        lastLoginAt: new Date(),
        profile: {
          id: "profile-123",
          bio: "Test bio",
        },
      };

      mockPrismaService.adminUser.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateUserInfo(adminUserId, mockData);

      expect(mockPrismaService.adminUser.update).toHaveBeenCalledWith({
        where: { id: adminUserId },
        data: mockData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          profile: true,
        },
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it("should handle empty data object", async () => {
      const adminUserId = "user-123";
      const mockData = {};
      const mockUpdatedUser = {
        id: "user-123",
        email: "admin@example.com",
        firstName: "John",
        lastName: "Doe",
        avatar: "avatar.jpg",
        role: "ADMIN",
        isActive: true,
        lastLoginAt: new Date(),
        profile: {
          id: "profile-123",
          bio: "Test bio",
        },
      };

      mockPrismaService.adminUser.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateUserInfo(adminUserId, mockData);

      expect(mockPrismaService.adminUser.update).toHaveBeenCalledWith({
        where: { id: adminUserId },
        data: mockData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          profile: true,
        },
      });
      expect(result).toEqual(mockUpdatedUser);
    });
  });
});
