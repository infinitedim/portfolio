import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import { AdminProfileService } from "./admin-profile.service";
import {
  AuditLogService,
  AuditEventType,
  AuditSeverity,
} from "../security/audit-log.service";
import { Prisma } from "../../prisma/generated/prisma/client";

@Controller("admin/profile")
export class AdminProfileController {
  constructor(
    private readonly adminProfileService: AdminProfileService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  async getProfile(@Request() req: ExpressRequest & { user?: { id: string } }) {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      throw new Error("User not authenticated");
    }

    const profile = await this.adminProfileService.getProfile(adminUserId);

    await this.auditLogService.logEvent(
      {
        eventType: AuditEventType.DATA_VIEWED,
        severity: AuditSeverity.LOW,
        userId: adminUserId,
        resource: "AdminProfile",
        resourceId: adminUserId,
        action: "VIEW_PROFILE",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
      req,
    );

    return profile;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProfile(
    @Request() req: ExpressRequest & { user?: { id: string } },
    @Body()
    data: {
      bio?: string;
      phone?: string;
      timezone?: string;
      language?: string;
      preferences?: Prisma.InputJsonValue;
    },
  ) {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      throw new Error("User not authenticated");
    }

    const profile = await this.adminProfileService.createProfile(
      adminUserId,
      data,
    );

    await this.auditLogService.logEvent(
      {
        eventType: AuditEventType.DATA_CREATED,
        severity: AuditSeverity.MEDIUM,
        userId: adminUserId,
        resource: "AdminProfile",
        resourceId: adminUserId,
        action: "CREATE_PROFILE",
        details: { fields: Object.keys(data) },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
      req,
    );

    return profile;
  }

  @Put()
  async updateProfile(
    @Request() req: ExpressRequest & { user?: { id: string } },
    @Body()
    data: {
      bio?: string;
      phone?: string;
      timezone?: string;
      language?: string;
      preferences?: Prisma.InputJsonValue;
    },
  ) {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      throw new Error("User not authenticated");
    }

    const profile = await this.adminProfileService.updateProfile(
      adminUserId,
      data,
    );

    await this.auditLogService.logEvent(
      {
        eventType: AuditEventType.DATA_UPDATED,
        severity: AuditSeverity.MEDIUM,
        userId: adminUserId,
        resource: "AdminProfile",
        resourceId: adminUserId,
        action: "UPDATE_PROFILE",
        details: { fields: Object.keys(data) },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
      req,
    );

    return profile;
  }

  @Put("user-info")
  async updateUserInfo(
    @Request() req: ExpressRequest & { user?: { id: string } },
    @Body()
    data: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
    },
  ) {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      throw new Error("User not authenticated");
    }

    const user = await this.adminProfileService.updateUserInfo(
      adminUserId,
      data,
    );

    await this.auditLogService.logEvent(
      {
        eventType: AuditEventType.DATA_UPDATED,
        severity: AuditSeverity.MEDIUM,
        userId: adminUserId,
        resource: "AdminUser",
        resourceId: adminUserId,
        action: "UPDATE_USER_INFO",
        details: { fields: Object.keys(data) },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
      req,
    );

    return user;
  }
}
