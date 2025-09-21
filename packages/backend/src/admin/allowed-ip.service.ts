import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as ipaddr from "ipaddr.js";

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
    if (!ip || typeof ip !== "string") {
      return false;
    }

    // Trim whitespace and normalize the input
    const normalizedIp = ip.trim();

    // Check for empty string after trimming
    if (!normalizedIp) {
      return false;
    }

    // Additional pre-validation checks before using ipaddr.js
    // Reject strings with leading zeros in IPv4 octets (security concern)
    // Only apply this check to potential IPv4 addresses
    const looksLikeIPv4 = /^\d+\.\d+/.test(normalizedIp);
    if (looksLikeIPv4) {
      const ipv4LeadingZeroPattern = /\b0\d+\b/;
      if (ipv4LeadingZeroPattern.test(normalizedIp)) {
        return false;
      }

      // Reject incomplete IPv4 addresses (must have 4 octets)
      const ipv4Pattern = /^\d+\.\d+\.\d+\.\d+$/;
      if (!ipv4Pattern.test(normalizedIp)) {
        return false;
      }
    }

    try {
      // Use ipaddr.js for robust validation
      const parsedIp = ipaddr.process(normalizedIp);

      // Additional security checks
      if (parsedIp.kind() === "ipv4") {
        const ipv4 = parsedIp as ipaddr.IPv4;

        // Reject localhost (127.0.0.0/8)
        if (ipv4.match(ipaddr.IPv4.parse("127.0.0.0"), 8)) {
          return false;
        }

        // Reject 0.0.0.0/8 (this network)
        if (ipv4.match(ipaddr.IPv4.parse("0.0.0.0"), 8)) {
          return false;
        }

        // Reject 169.254.0.0/16 (link-local)
        if (ipv4.match(ipaddr.IPv4.parse("169.254.0.0"), 16)) {
          return false;
        }

        // Reject 224.0.0.0/4 (multicast)
        if (ipv4.match(ipaddr.IPv4.parse("224.0.0.0"), 4)) {
          return false;
        }

        // Reject 240.0.0.0/4 (reserved) but allow 255.255.255.255
        if (
          ipv4.match(ipaddr.IPv4.parse("240.0.0.0"), 4) &&
          normalizedIp !== "255.255.255.255"
        ) {
          return false;
        }
      } else if (parsedIp.kind() === "ipv6") {
        const ipv6 = parsedIp as ipaddr.IPv6;

        // Reject loopback (::1)
        if (ipv6.toString() === "::1") {
          return false;
        }

        // Reject unspecified address (::)
        if (ipv6.toString() === "::") {
          return false;
        }

        // Reject link-local addresses (fe80::/10)
        if (ipv6.match(ipaddr.IPv6.parse("fe80::"), 10)) {
          return false;
        }

        // Reject multicast addresses (ff00::/8)
        if (ipv6.match(ipaddr.IPv6.parse("ff00::"), 8)) {
          return false;
        }
      }

      return true;
    } catch (_error) {
      // ipaddr.js throws an error for invalid IP addresses
      return false;
    }
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
