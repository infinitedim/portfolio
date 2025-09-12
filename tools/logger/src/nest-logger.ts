import { Module } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import { Logger } from "./logger";
import type { LoggerConfig } from "./logger";

/**
 * NestJS Logger Module that integrates Winston with NestJS
 * Provides both the centralized logger and Winston integration
 */
@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: (config?: LoggerConfig) => {
        const logger = new Logger(config);
        return {
          instance: logger.getWinstonLogger(),
        };
      },
      inject: [],
    }),
  ],
  providers: [
    {
      provide: "LOGGER",
      useFactory: (config?: LoggerConfig) => {
        return new Logger(config);
      },
      inject: [],
    },
  ],
  exports: ["LOGGER"],
})
export class PortfolioLoggerModule { }

/**
 * Factory function to create a Winston logger configuration for NestJS
 * @param {LoggerConfig} config - Logger configuration
 * @returns {object} Winston configuration for NestJS
 */
export function createNestWinstonConfig(config?: LoggerConfig) {
  const logger = new Logger(config);
  return {
    instance: logger.getWinstonLogger(),
  };
}

/**
 * NestJS Logger Service that wraps the centralized logger
 */
export class PortfolioLoggerService {
  private logger: Logger;

  constructor(config?: LoggerConfig) {
    this.logger = new Logger(config);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  http(message: string, meta?: Record<string, unknown>): void {
    this.logger.http(message, meta);
  }

  profile(id: string, meta?: Record<string, unknown>): void {
    this.logger.profile(id, meta);
  }

  startTimer(): { done: (meta?: Record<string, unknown>) => void } {
    return this.logger.startTimer();
  }

  getWinstonLogger() {
    return this.logger.getWinstonLogger();
  }
}
