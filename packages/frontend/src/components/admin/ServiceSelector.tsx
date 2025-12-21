"use client";

import type { ThemeConfig } from "@/types/theme";
import type { Service } from "./BackendTestingDashboard";

interface ServiceSelectorProps {
  services: Service[];
  selectedService: Service | null;
  onServiceSelect: (service: Service) => void;
  themeConfig: ThemeConfig;
}

/**
 *
 * @param root0
 * @param root0.services
 * @param root0.selectedService
 * @param root0.onServiceSelect
 * @param root0.themeConfig
 */
export function ServiceSelector({
  services,
  selectedService,
  onServiceSelect,
  themeConfig,
}: ServiceSelectorProps) {
  return (
    <div className="space-y-3">
      {services.map((service) => (
        <button
          key={service.name}
          onClick={() => onServiceSelect(service)}
          className={`w-full p-4 text-left border rounded-lg transition-all duration-200 font-mono text-sm ${selectedService?.name === service.name
              ? "scale-105"
              : "hover:scale-102 hover:opacity-80"
            }`}
          style={{
            borderColor:
              selectedService?.name === service.name
                ? themeConfig.colors.accent
                : themeConfig.colors.border,
            backgroundColor:
              selectedService?.name === service.name
                ? `${themeConfig.colors.accent}20`
                : themeConfig.colors.bg,
            color:
              selectedService?.name === service.name
                ? themeConfig.colors.accent
                : themeConfig.colors.text,
          }}
        >
          <div className="flex items-start space-x-3">
            <div
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor:
                  selectedService?.name === service.name
                    ? themeConfig.colors.accent
                    : themeConfig.colors.border,
                color:
                  selectedService?.name === service.name
                    ? themeConfig.colors.bg
                    : themeConfig.colors.text,
              }}
            >
              {service.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base">
                {service.displayName}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {service.description}
              </div>
              <div className="text-xs opacity-50 mt-1">
                {service.methods.length} method
                {service.methods.length !== 1 ? "s" : ""} available
              </div>
            </div>
            {selectedService?.name === service.name && (
              <span className="text-xs opacity-50">▶</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
