/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AdminProfileService } from "./admin-profile.service";
import { AllowedIpService } from "./allowed-ip.service";
import {
  AuditLogService,
  AuditEventType,
  AuditSeverity,
} from "../security/audit-log.service";

@Controller("admin/profile")
export class AdminProfileController {
  constructor(
    private readonly adminProfileService: AdminProfileService,
    private readonly allowedIpService: AllowedIpService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  async getProfile(@Request() req) {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      throw new Error("User not authenticated");
    }

    const profile = await this.adminProfileService.getProfile(adminUserId);

    // Log the action
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
    @Request() req,
    @Body()
    data: {
      bio?: string;
      phone?: string;
      timezone?: string;
      language?: string;
      preferences?: any;
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

    // Log the action
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
    @Request() req,
    @Body()
    data: {
      bio?: string;
      phone?: string;
      timezone?: string;
      language?: string;
      preferences?: any;
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

    // Log the action
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
    @Request() req,
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

    // Log the action
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

  // IP Allowlist endpoints
  @Get("allowed-ips")
  async getAllowedIps(@Request() req) {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      throw new Error("User not authenticated");
    }

    const ips = await this.allowedIpService.getAllowedIps(adminUserId);

    // Log the action
    await this.auditLogService.logEvent(
      {
        eventType: AuditEventType.DATA_VIEWED,
        severity: AuditSeverity.LOW,
        userId: adminUserId,
        resource: "AllowedIp",
        action: "VIEW_ALLOWED_IPS",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
      req,
    );

    return ips;
  }

  @Post("allowed-ips")
  @HttpCode(HttpStatus.CREATED)
  async addAllowedIp(
    @Request() req,
    @Body()
    data: {
      ipAddress: string;
      description?: string;
    },
  ) {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      throw new Error("User not authenticated");
    }

    const allowedIp = await this.allowedIpService.addAllowedIp(
      adminUserId,
      data,
    );

    // Log the action
    await this.auditLogService.logEvent(
      {
        eventType: AuditEventType.DATA_CREATED,
        severity: AuditSeverity.MEDIUM,
        userId: adminUserId,
        resource: "AllowedIp",
        resourceId: allowedIp.id,
        action: "ADD_ALLOWED_IP",
        details: { ipAddress: data.ipAddress },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
      req,
    );

    return allowedIp;
  }

  @Put("allowed-ips/:id")
  async updateAllowedIp(
    @Request() req,
    @Param("id") id: string,
    @Body()
    data: {
      description?: string;
      isActive?: boolean;
    },
  ) {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      throw new Error("User not authenticated");
    }

    const allowedIp = await this.allowedIpService.updateAllowedIp(
      id,
      adminUserId,
      data,
    );

    // Log the action
    await this.auditLogService.logEvent(
      {
        eventType: AuditEventType.DATA_UPDATED,
        severity: AuditSeverity.MEDIUM,
        userId: adminUserId,
        resource: "AllowedIp",
        resourceId: id,
        action: "UPDATE_ALLOWED_IP",
        details: { fields: Object.keys(data) },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
      req,
    );

    return allowedIp;
  }

  @Post("allowed-ips/:id/remove")
  @HttpCode(HttpStatus.OK)
  async removeAllowedIp(@Request() req, @Param("id") id: string) {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      throw new Error("User not authenticated");
    }

    const allowedIp = await this.allowedIpService.removeAllowedIp(
      id,
      adminUserId,
    );

    // Log the action
    await this.auditLogService.logEvent(
      {
        eventType: AuditEventType.DATA_DELETED,
        severity: AuditSeverity.MEDIUM,
        userId: adminUserId,
        resource: "AllowedIp",
        resourceId: id,
        action: "REMOVE_ALLOWED_IP",
        details: { ipAddress: allowedIp.ipAddress },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
      req,
    );

    return { message: "IP address removed successfully" };
  }

  @Get("allowed-ips/stats")
  async getIpStats(@Request() req) {
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      throw new Error("User not authenticated");
    }

    const stats = await this.allowedIpService.getIpStats(adminUserId);

    // Log the action
    await this.auditLogService.logEvent(
      {
        eventType: AuditEventType.DATA_VIEWED,
        severity: AuditSeverity.LOW,
        userId: adminUserId,
        resource: "AllowedIp",
        action: "VIEW_IP_STATS",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
      req,
    );

    return stats;
  }
}
