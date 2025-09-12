import { describe, it, expect, beforeEach, vi } from "vitest";
import { AllowedIpService } from "../allowed-ip.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

// Mock PrismaService
const mockPrismaService = {
  allowedIp: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
};

describe("AllowedIpService", () => {
  let service: AllowedIpService;

  beforeEach(() => {
    // Create service instance directly with mocked dependencies

    service = new AllowedIpService(mockPrismaService as any);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("addAllowedIp", () => {
    it("should add allowed IP successfully", async () => {
      const adminUserId = "user-123";
      const mockData = {
        ipAddress: "192.168.1.100",
        description: "Home IP",
      };
      const mockCreatedIp = {
        id: "ip-1",
        adminUserId,
        ...mockData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.allowedIp.findFirst.mockResolvedValue(null);
      mockPrismaService.allowedIp.create.mockResolvedValue(mockCreatedIp);

      const result = await service.addAllowedIp(adminUserId, mockData);

      expect(mockPrismaService.allowedIp.findFirst).toHaveBeenCalledWith({
        where: {
          adminUserId,
          ipAddress: mockData.ipAddress,
        },
      });
      expect(mockPrismaService.allowedIp.create).toHaveBeenCalledWith({
        data: {
          adminUserId,
          ipAddress: mockData.ipAddress,
          description: mockData.description,
        },
      });
      expect(result).toEqual(mockCreatedIp);
    });

    it("should throw BadRequestException for invalid IP address", async () => {
      const adminUserId = "user-123";
      const mockData = {
        ipAddress: "invalid-ip",
        description: "Invalid IP",
      };

      await expect(service.addAllowedIp(adminUserId, mockData)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.allowedIp.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.allowedIp.create).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when IP already exists", async () => {
      const adminUserId = "user-123";
      const mockData = {
        ipAddress: "192.168.1.100",
        description: "Home IP",
      };
      const mockExistingIp = {
        id: "ip-1",
        adminUserId,
        ipAddress: mockData.ipAddress,
        description: "Existing IP",
      };

      mockPrismaService.allowedIp.findFirst.mockResolvedValue(mockExistingIp);

      await expect(service.addAllowedIp(adminUserId, mockData)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.allowedIp.findFirst).toHaveBeenCalledWith({
        where: {
          adminUserId,
          ipAddress: mockData.ipAddress,
        },
      });
      expect(mockPrismaService.allowedIp.create).not.toHaveBeenCalled();
    });

    it("should validate IPv4 addresses correctly", async () => {
      const adminUserId = "user-123";
      const validIps = [
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1",
        "127.0.0.1",
        "255.255.255.255",
      ];

      for (const ip of validIps) {
        const mockData = { ipAddress: ip, description: "Test IP" };
        const mockCreatedIp = { id: "ip-1", adminUserId, ...mockData };

        mockPrismaService.allowedIp.findFirst.mockResolvedValue(null);
        mockPrismaService.allowedIp.create.mockResolvedValue(mockCreatedIp);

        const result = await service.addAllowedIp(adminUserId, mockData);
        expect(result).toEqual(mockCreatedIp);
      }
    });

    it("should validate IPv6 addresses correctly", async () => {
      const adminUserId = "user-123";
      const validIps = ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"];

      for (const ip of validIps) {
        const mockData = { ipAddress: ip, description: "Test IP" };
        const mockCreatedIp = { id: "ip-1", adminUserId, ...mockData };

        mockPrismaService.allowedIp.findFirst.mockResolvedValue(null);
        mockPrismaService.allowedIp.create.mockResolvedValue(mockCreatedIp);

        const result = await service.addAllowedIp(adminUserId, mockData);
        expect(result).toEqual(mockCreatedIp);
      }
    });
  });

  describe("getAllowedIps", () => {
    it("should get allowed IPs successfully", async () => {
      const adminUserId = "user-123";
      const mockIps = [
        {
          id: "ip-1",
          adminUserId,
          ipAddress: "192.168.1.1",
          description: "Home",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "ip-2",
          adminUserId,
          ipAddress: "10.0.0.1",
          description: "Office",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.allowedIp.findMany.mockResolvedValue(mockIps);

      const result = await service.getAllowedIps(adminUserId);

      expect(mockPrismaService.allowedIp.findMany).toHaveBeenCalledWith({
        where: {
          adminUserId,
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      expect(result).toEqual(mockIps);
    });

    it("should return empty array when no IPs found", async () => {
      const adminUserId = "user-123";

      mockPrismaService.allowedIp.findMany.mockResolvedValue([]);

      const result = await service.getAllowedIps(adminUserId);

      expect(result).toEqual([]);
    });
  });

  describe("updateAllowedIp", () => {
    it("should update allowed IP successfully", async () => {
      const id = "ip-1";
      const adminUserId = "user-123";
      const mockData = {
        description: "Updated description",
        isActive: false,
      };
      const mockExistingIp = {
        id,
        adminUserId,
        ipAddress: "192.168.1.1",
        description: "Old description",
        isActive: true,
      };
      const mockUpdatedIp = {
        ...mockExistingIp,
        ...mockData,
        updatedAt: new Date(),
      };

      mockPrismaService.allowedIp.findFirst.mockResolvedValue(mockExistingIp);
      mockPrismaService.allowedIp.update.mockResolvedValue(mockUpdatedIp);

      const result = await service.updateAllowedIp(id, adminUserId, mockData);

      expect(mockPrismaService.allowedIp.findFirst).toHaveBeenCalledWith({
        where: {
          id,
          adminUserId,
        },
      });
      expect(mockPrismaService.allowedIp.update).toHaveBeenCalledWith({
        where: { id },
        data: mockData,
      });
      expect(result).toEqual(mockUpdatedIp);
    });

    it("should throw NotFoundException when IP not found", async () => {
      const id = "ip-1";
      const adminUserId = "user-123";
      const mockData = { description: "Updated description" };

      mockPrismaService.allowedIp.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAllowedIp(id, adminUserId, mockData),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.allowedIp.findFirst).toHaveBeenCalledWith({
        where: {
          id,
          adminUserId,
        },
      });
      expect(mockPrismaService.allowedIp.update).not.toHaveBeenCalled();
    });

    it("should update with partial data", async () => {
      const id = "ip-1";
      const adminUserId = "user-123";
      const mockData = { description: "Updated description" };
      const mockExistingIp = {
        id,
        adminUserId,
        ipAddress: "192.168.1.1",
        description: "Old description",
        isActive: true,
      };
      const mockUpdatedIp = {
        ...mockExistingIp,
        description: "Updated description",
        updatedAt: new Date(),
      };

      mockPrismaService.allowedIp.findFirst.mockResolvedValue(mockExistingIp);
      mockPrismaService.allowedIp.update.mockResolvedValue(mockUpdatedIp);

      const result = await service.updateAllowedIp(id, adminUserId, mockData);

      expect(mockPrismaService.allowedIp.update).toHaveBeenCalledWith({
        where: { id },
        data: mockData,
      });
      expect(result).toEqual(mockUpdatedIp);
    });
  });

  describe("removeAllowedIp", () => {
    it("should remove allowed IP successfully", async () => {
      const id = "ip-1";
      const adminUserId = "user-123";
      const mockExistingIp = {
        id,
        adminUserId,
        ipAddress: "192.168.1.1",
        description: "Home IP",
        isActive: true,
      };

      mockPrismaService.allowedIp.findFirst.mockResolvedValue(mockExistingIp);
      mockPrismaService.allowedIp.delete.mockResolvedValue(mockExistingIp);

      const result = await service.removeAllowedIp(id, adminUserId);

      expect(mockPrismaService.allowedIp.findFirst).toHaveBeenCalledWith({
        where: {
          id,
          adminUserId,
        },
      });
      expect(mockPrismaService.allowedIp.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockExistingIp);
    });

    it("should throw NotFoundException when IP not found", async () => {
      const id = "ip-1";
      const adminUserId = "user-123";

      mockPrismaService.allowedIp.findFirst.mockResolvedValue(null);

      await expect(service.removeAllowedIp(id, adminUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.allowedIp.findFirst).toHaveBeenCalledWith({
        where: {
          id,
          adminUserId,
        },
      });
      expect(mockPrismaService.allowedIp.delete).not.toHaveBeenCalled();
    });
  });

  describe("isIpAllowed", () => {
    it("should return true when IP is allowed", async () => {
      const adminUserId = "user-123";
      const ipAddress = "192.168.1.1";
      const mockAllowedIp = {
        id: "ip-1",
        adminUserId,
        ipAddress,
        description: "Home IP",
        isActive: true,
      };

      mockPrismaService.allowedIp.findFirst.mockResolvedValue(mockAllowedIp);
      mockPrismaService.allowedIp.update.mockResolvedValue(mockAllowedIp);

      const result = await service.isIpAllowed(adminUserId, ipAddress);

      expect(mockPrismaService.allowedIp.findFirst).toHaveBeenCalledWith({
        where: {
          adminUserId,
          ipAddress,
          isActive: true,
        },
      });
      expect(mockPrismaService.allowedIp.update).toHaveBeenCalledWith({
        where: { id: mockAllowedIp.id },
        data: { lastUsedAt: expect.any(Date) },
      });
      expect(result).toBe(true);
    });

    it("should return false when IP is not allowed", async () => {
      const adminUserId = "user-123";
      const ipAddress = "192.168.1.100";

      mockPrismaService.allowedIp.findFirst.mockResolvedValue(null);

      const result = await service.isIpAllowed(adminUserId, ipAddress);

      expect(mockPrismaService.allowedIp.findFirst).toHaveBeenCalledWith({
        where: {
          adminUserId,
          ipAddress,
          isActive: true,
        },
      });
      expect(mockPrismaService.allowedIp.update).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe("updateLastUsed", () => {
    it("should update last used timestamp", async () => {
      const ipAddress = "192.168.1.1";
      const adminUserId = "user-123";

      mockPrismaService.allowedIp.updateMany.mockResolvedValue({ count: 1 });

      await service.updateLastUsed(ipAddress, adminUserId);

      expect(mockPrismaService.allowedIp.updateMany).toHaveBeenCalledWith({
        where: {
          adminUserId,
          ipAddress,
          isActive: true,
        },
        data: {
          lastUsedAt: expect.any(Date),
        },
      });
    });
  });

  describe("getIpStats", () => {
    it("should get IP stats successfully", async () => {
      const adminUserId = "user-123";
      const mockStats = {
        total: 5,
        active: 3,
        recentlyUsed: 2,
      };

      mockPrismaService.allowedIp.count
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(3) // active
        .mockResolvedValueOnce(2); // recently used

      const result = await service.getIpStats(adminUserId);

      expect(mockPrismaService.allowedIp.count).toHaveBeenCalledTimes(3);
      expect(mockPrismaService.allowedIp.count).toHaveBeenNthCalledWith(1, {
        where: { adminUserId },
      });
      expect(mockPrismaService.allowedIp.count).toHaveBeenNthCalledWith(2, {
        where: {
          adminUserId,
          isActive: true,
        },
      });
      expect(mockPrismaService.allowedIp.count).toHaveBeenNthCalledWith(3, {
        where: {
          adminUserId,
          isActive: true,
          lastUsedAt: {
            gte: expect.any(Date),
          },
        },
      });
      expect(result).toEqual(mockStats);
    });

    it("should handle zero stats", async () => {
      const adminUserId = "user-123";

      mockPrismaService.allowedIp.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // active
        .mockResolvedValueOnce(0); // recently used

      const result = await service.getIpStats(adminUserId);

      expect(result).toEqual({
        total: 0,
        active: 0,
        recentlyUsed: 0,
      });
    });
  });

  describe("IP validation", () => {
    it("should validate various IP formats", () => {
      const validIps = [
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1",
        "127.0.0.1",
        "255.255.255.255",
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      ];

      const invalidIps = [
        "invalid-ip",
        "192.168.1.256",
        "192.168.1",
        "192.168.1.1.1",
        "192.168.1.1:8080",
        "http://192.168.1.1",
        "192.168.1.1/24",
        "localhost",
        "example.com",
        "::1",
        "fe80::1",
      ];

      validIps.forEach((ip) => {
        expect(service["isValidIpAddress"](ip)).toBe(true);
      });

      invalidIps.forEach((ip) => {
        expect(service["isValidIpAddress"](ip)).toBe(false);
      });
    });
  });
});
