import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AllowedIpService {
  constructor(private prisma: PrismaService) {}

  async addAllowedIp(
    adminUserId: string,
    data: {
      ipAddress: string;
      description?: string;
    },
  ) {
    // Validate IP address format
    if (!this.isValidIpAddress(data.ipAddress)) {
      throw new BadRequestException("Invalid IP address format");
    }

    // Check if IP already exists for this user
    const existingIp = await this.prisma.allowedIp.findFirst({
      where: {
        adminUserId,
        ipAddress: data.ipAddress,
      },
    });

    if (existingIp) {
      throw new BadRequestException("IP address already allowed for this user");
    }

    return this.prisma.allowedIp.create({
      data: {
        adminUserId,
        ipAddress: data.ipAddress,
        description: data.description,
      },
    });
  }

  async getAllowedIps(adminUserId: string) {
    return this.prisma.allowedIp.findMany({
      where: {
        adminUserId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateAllowedIp(
    id: string,
    adminUserId: string,
    data: {
      description?: string;
      isActive?: boolean;
    },
  ) {
    const allowedIp = await this.prisma.allowedIp.findFirst({
      where: {
        id,
        adminUserId,
      },
    });

    if (!allowedIp) {
      throw new NotFoundException("Allowed IP not found");
    }

    return this.prisma.allowedIp.update({
      where: { id },
      data,
    });
  }

  async removeAllowedIp(id: string, adminUserId: string) {
    const allowedIp = await this.prisma.allowedIp.findFirst({
      where: {
        id,
        adminUserId,
      },
    });

    if (!allowedIp) {
      throw new NotFoundException("Allowed IP not found");
    }

    return this.prisma.allowedIp.delete({
      where: { id },
    });
  }

  async isIpAllowed(adminUserId: string, ipAddress: string): Promise<boolean> {
    const allowedIp = await this.prisma.allowedIp.findFirst({
      where: {
        adminUserId,
        ipAddress,
        isActive: true,
      },
    });

    if (allowedIp) {
      // Update last used timestamp
      await this.prisma.allowedIp.update({
        where: { id: allowedIp.id },
        data: { lastUsedAt: new Date() },
      });
    }

    return !!allowedIp;
  }

  async updateLastUsed(ipAddress: string, adminUserId: string) {
    await this.prisma.allowedIp.updateMany({
      where: {
        adminUserId,
        ipAddress,
        isActive: true,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });
  }

  private isValidIpAddress(ip: string): boolean {
    // Basic IPv4 validation
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // Basic IPv6 validation (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  async getIpStats(adminUserId: string) {
    const totalIps = await this.prisma.allowedIp.count({
      where: { adminUserId },
    });

    const activeIps = await this.prisma.allowedIp.count({
      where: {
        adminUserId,
        isActive: true,
      },
    });

    const recentlyUsedIps = await this.prisma.allowedIp.count({
      where: {
        adminUserId,
        isActive: true,
        lastUsedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    return {
      total: totalIps,
      active: activeIps,
      recentlyUsed: recentlyUsedIps,
    };
  }
}
