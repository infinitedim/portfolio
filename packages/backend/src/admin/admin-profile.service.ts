
import {Injectable, NotFoundException} from "@nestjs/common";
import {PrismaService} from "../prisma/prisma.service";

@Injectable()
export class AdminProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(adminUserId: string) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: {adminUserId},
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

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    return profile;
  }

  async createProfile(
    adminUserId: string,
    data: {
      bio?: string;
      phone?: string;
      timezone?: string;
      language?: string;
      preferences?: Record<string, unknown>;
    },
  ) {
    return this.prisma.adminProfile.create({
      data: {
        adminUserId,
        ...data,
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
  }

  async updateProfile(
    adminUserId: string,
    data: Partial<{
      bio: string;
      phone: string;
      timezone: string;
      language: string;
      preferences: Record<string, unknown>;
    }>,
  ) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: {adminUserId},
    });

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    return this.prisma.adminProfile.update({
      where: {adminUserId},
      data,
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
  }

  async updateUserInfo(
    adminUserId: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      avatar: string;
    }>,
  ) {
    return this.prisma.adminUser.update({
      where: {id: adminUserId},
      data,
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
  }
}
