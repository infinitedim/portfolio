"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
import type { ThemeConfig } from "@/types/theme";

/**
 * Represents performance metrics at a specific point in time
 * @interface PerformanceData
 * @property {number} timestamp - Unix timestamp when metrics were captured
 * @property {number} cpu - CPU usage percentage (0-100)
 * @property {number} memory - Memory usage percentage (0-100)
 * @property {number} network - Network throughput in MB/s
 * @property {number} disk - Disk I/O usage percentage (0-100)
 */
interface PerformanceData {
  timestamp: number;
  cpu: number;
  memory: number;
  network: number;
  disk: number;
}

/**
 * Props for the PerformanceMonitor component
 * @interface PerformanceMonitorProps
 * @property {ThemeConfig} themeConfig - Theme configuration for styling
 */
interface PerformanceMonitorProps {
  themeConfig: ThemeConfig;
}

/**
 * Real-time performance monitoring component with visual graphs
 * Displays CPU, memory, network, and disk metrics with live updating canvas visualization
 * Optimized with memoization and efficient rendering for smooth performance
 * @param {PerformanceMonitorProps} props - Component props
 * @param {ThemeConfig} props.themeConfig - Theme configuration for styling
 * @returns {JSX.Element} The performance monitor component
 * @example
 * ```tsx
 * <PerformanceMonitor themeConfig={themeConfig} />
 * ```
 */
function PerformanceMonitorComponent({ themeConfig }: PerformanceMonitorProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [refreshRate, setRefreshRate] = useState(1000);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const generateMockData = useCallback(
    (): PerformanceData => ({
      timestamp: Date.now(),
      cpu: Math.random() * 100,
      memory: 30 + Math.random() * 40,
      network: Math.random() * 10,
      disk: 10 + Math.random() * 20,
    }),
    [],
  );

  const performanceStats = useMemo(() => {
    if (performanceData.length === 0) {
      return {
        maxCpu: 0,
        maxMemory: 0,
        maxNetwork: 0,
        maxDisk: 0,
        avgCpu: 0,
        avgMemory: 0,
        avgNetwork: 0,
        avgDisk: 0,
      };
    }

    const totalCount = performanceData.length;
    return {
      maxCpu: Math.max(...performanceData.map((d) => d.cpu)),
      maxMemory: Math.max(...performanceData.map((d) => d.memory)),
      maxNetwork: Math.max(...performanceData.map((d) => d.network)),
      maxDisk: Math.max(...performanceData.map((d) => d.disk)),
      avgCpu: performanceData.reduce((sum, d) => sum + d.cpu, 0) / totalCount,
      avgMemory:
        performanceData.reduce((sum, d) => sum + d.memory, 0) / totalCount,
      avgNetwork:
        performanceData.reduce((sum, d) => sum + d.network, 0) / totalCount,
      avgDisk: performanceData.reduce((sum, d) => sum + d.disk, 0) / totalCount,
    };
  }, [performanceData]);

  useEffect(() => {
    const initialData = Array.from({ length: 60 }, () => generateMockData());
    setPerformanceData(initialData);
  }, [generateMockData]);

  useEffect(() => {
    if (isPaused) return;

    const updateData = () => {
      setPerformanceData((prev) => {
        const newData = [...prev, generateMockData()];
        if (newData.length > 60) {
          newData.shift();
        }
        return newData;
      });
    };

    const interval = setInterval(updateData, refreshRate);

    return () => clearInterval(interval);
  }, [isPaused, refreshRate, generateMockData]);

  useEffect(() => {
    const currentAnimationId = animationRef.current;

    return () => {
      if (currentAnimationId) {
        cancelAnimationFrame(currentAnimationId);
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = themeConfig.colors.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = themeConfig.colors.border;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    if (performanceData.length > 1) {
      ctx.strokeStyle = themeConfig.colors.success || "#00ff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      performanceData.forEach((data, index) => {
        const x = (width / 60) * index;
        const y = height - (data.cpu / 100) * height;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    if (performanceData.length > 1) {
      ctx.strokeStyle = themeConfig.colors.warning || "#ffaa00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      performanceData.forEach((data, index) => {
        const x = (width / 60) * index;
        const y = height - (data.memory / 100) * height;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    if (performanceData.length > 1) {
      ctx.strokeStyle = themeConfig.colors.info || "#00aaff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      performanceData.forEach((data, index) => {
        const x = (width / 60) * index;
        const y = height - (data.network / 10) * height;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    ctx.font = "12px JetBrains Mono";
    ctx.fillStyle = themeConfig.colors.text;

    const legendItems = [
      { label: "CPU", color: themeConfig.colors.success || "#00ff00" },
      { label: "Memory", color: themeConfig.colors.warning || "#ffaa00" },
      { label: "Network", color: themeConfig.colors.info || "#00aaff" },
    ];

    legendItems.forEach((item, index) => {
      const y = 20 + index * 20;
      ctx.fillStyle = item.color;
      ctx.fillRect(10, y - 8, 12, 2);
      ctx.fillStyle = themeConfig.colors.text;
      ctx.fillText(item.label, 30, y);
    });
  }, [performanceData, themeConfig]);

  const currentData = performanceData[performanceData.length - 1];

  return (
    <div className="space-y-6">
      { }
      <div
        className="p-4 border rounded"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: themeConfig.colors.bg,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span
              className="text-sm font-mono"
              style={{ color: themeConfig.colors.accent }}
            >
              monitor@portfolio:~$
            </span>
            <span className="text-sm opacity-70">./performance.sh</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1 text-xs border rounded transition-colors"
              style={{
                borderColor: isPaused
                  ? themeConfig.colors.success
                  : themeConfig.colors.border,
                color: isPaused
                  ? themeConfig.colors.success
                  : themeConfig.colors.text,
              }}
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <select
              value={refreshRate}
              onChange={(e) => setRefreshRate(Number(e.target.value))}
              className="px-2 py-1 text-xs border rounded bg-transparent"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            >
              <option value={500}>0.5s</option>
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
            </select>
          </div>
        </div>

        { }
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: themeConfig.colors.success }}
            >
              {currentData?.cpu.toFixed(1)}%
            </div>
            <div className="text-xs opacity-70">CPU Usage</div>
          </div>
          <div className="text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: themeConfig.colors.warning }}
            >
              {currentData?.memory.toFixed(1)}%
            </div>
            <div className="text-xs opacity-70">Memory Usage</div>
          </div>
          <div className="text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: themeConfig.colors.info }}
            >
              {currentData?.network.toFixed(1)}MB/s
            </div>
            <div className="text-xs opacity-70">Network I/O</div>
          </div>
          <div className="text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: themeConfig.colors.accent }}
            >
              {currentData?.disk.toFixed(1)}%
            </div>
            <div className="text-xs opacity-70">Disk Usage</div>
          </div>
        </div>
      </div>

      { }
      <div
        className="p-4 border rounded"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: themeConfig.colors.bg,
        }}
      >
        <div
          className="text-sm font-bold mb-4"
          style={{ color: themeConfig.colors.accent }}
        >
          Real-time Performance Metrics
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="w-full h-64 border rounded"
          style={{ borderColor: themeConfig.colors.border }}
        />
      </div>

      { }
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="p-4 border rounded"
          style={{
            borderColor: themeConfig.colors.border,
            backgroundColor: themeConfig.colors.bg,
          }}
        >
          <div
            className="text-sm font-bold mb-3"
            style={{ color: themeConfig.colors.accent }}
          >
            Peak Values
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="opacity-70">CPU Peak:</span>
              <span style={{ color: themeConfig.colors.success }}>
                {performanceStats.maxCpu.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Memory Peak:</span>
              <span style={{ color: themeConfig.colors.warning }}>
                {performanceStats.maxMemory.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Network Peak:</span>
              <span style={{ color: themeConfig.colors.info }}>
                {performanceStats.maxNetwork.toFixed(1)}
                MB/s
              </span>
            </div>
          </div>
        </div>

        <div
          className="p-4 border rounded"
          style={{
            borderColor: themeConfig.colors.border,
            backgroundColor: themeConfig.colors.bg,
          }}
        >
          <div
            className="text-sm font-bold mb-3"
            style={{ color: themeConfig.colors.accent }}
          >
            Average Values
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="opacity-70">CPU Avg:</span>
              <span style={{ color: themeConfig.colors.success }}>
                {performanceStats.avgCpu.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Memory Avg:</span>
              <span style={{ color: themeConfig.colors.warning }}>
                {performanceStats.avgMemory.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Network Avg:</span>
              <span style={{ color: themeConfig.colors.info }}>
                {performanceStats.avgNetwork.toFixed(1)}
                MB/s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const PerformanceMonitor = memo(PerformanceMonitorComponent);
