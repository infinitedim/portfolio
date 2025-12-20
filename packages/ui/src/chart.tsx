 
"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "./utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

/**
 * A hook to access the chart context.
 *
 * This hook must be used within a `<ChartContainer />` component.
 * It provides access to the chart's configuration.
 * @returns {ChartContextProps} The chart context, containing the chart configuration.
 * @throws {Error} If used outside of a `<ChartContainer />`.
 */
function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

/**
 * A container for charts that provides context and styling.
 * It wraps a Recharts `ResponsiveContainer` and provides a `ChartContext` to its children.
 * @param {object} props - The properties for the ChartContainer component.
 * @param {string} [props.id] - An optional unique ID for the chart.
 * @param {string} [props.className] - Additional class names for the container.
 * @param {React.ReactNode} props.children - The chart components to be rendered inside the container.
 * @param {ChartConfig} props.config - The configuration object for the chart, defining colors and labels for data keys.
 * @returns {React.JSX.Element} The chart container component.
 */
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle
          id={chartId}
          config={config}
        />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

/**
 * A component that generates and injects CSS variables for chart colors based on the provided configuration.
 * This allows for theme-aware chart styling.
 * @param {object} props - The properties for the ChartStyle component.
 * @param {string} props.id - The unique ID of the chart to apply styles to.
 * @param {ChartConfig} props.config - The chart configuration object.
 * @returns {React.JSX.Element | null} A style element with CSS variables, or null if no color config is provided.
 */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color,
  );

  if (!colorConfig.length) {
    return null;
  }

  const cssContent = Object.entries(THEMES)
    .map(([theme, prefix]) => {
      const cssVariables = colorConfig
        .map(([key, itemConfig]) => {
          const color =
            itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
            itemConfig.color;
          return color ? `  --color-${key}: ${color};` : null;
        })
        .filter(Boolean)
        .join("\n");

      return `${prefix} [data-chart=${id}] {\n${cssVariables}\n}`;
    })
    .join("\n");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: cssContent,
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

/**
 * A custom tooltip content component for Recharts charts.
 * It displays formatted data from the chart payload, using the configuration from `ChartContext`.
 * @param {object} props - The properties for the ChartTooltipContent component.
 * @param {boolean} [props.active] - Whether the tooltip is active. Provided by Recharts.
 * @param {any[]} [props.payload] - The data payload for the tooltip. Provided by Recharts.
 * @param {string} [props.className] - Additional class names for the tooltip container.
 * @param {"line" | "dot" | "dashed"} [props.indicator="dot"] - The type of indicator to display next to each item.
 * @param {boolean} [props.hideLabel=false] - Whether to hide the main tooltip label.
 * @param {boolean} [props.hideIndicator=false] - Whether to hide the color indicator for each item.
 * @param {React.ReactNode} [props.label] - The label for the tooltip.
 * @param {Function} [props.labelFormatter] - A function to format the tooltip label.
 * @param {string} [props.labelClassName] - Class names for the tooltip label.
 * @param {Function} [props.formatter] - A function to format the tooltip content.
 * @param {string} [props.color] - A specific color for the indicator.
 * @param {string} [props.nameKey] - The key in the payload to use for the item name.
 * @param {string} [props.labelKey] - The key in the payload to use for the label.
 * @returns {React.JSX.Element | null} The rendered tooltip content, or null if not active.
 */
type ChartPayloadItem = {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
  payload?: { [key: string]: unknown; fill?: string };
};

type ChartTooltipExtraProps = {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: React.ReactNode;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
  labelFormatter?: (value: unknown, payload?: ChartPayloadItem[]) => React.ReactNode;
  formatter?: (
    value: unknown,
    name: string,
    item: ChartPayloadItem,
    index: number,
    itemPayload: ChartPayloadItem["payload"],
  ) => React.ReactNode;
  color?: string;
  labelClassName?: string;
};

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & ChartTooltipExtraProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload || [];
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        );
      }

      if (!value) {
        return null;
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>;
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = (payload?.length || 0) === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-32 items-start gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className,
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {(payload || []).map((item, index) => {
            const key = `${nameKey || (typeof item.name === "string" ? item.name : item.dataKey) || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color || item.payload?.fill || item.color;

            return (
              <div
                key={String(item.dataKey ?? index)}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-xs border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            },
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Number(item.value).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

/**
 * A custom legend content component for Recharts charts.
 * It displays a legend based on the chart's payload and configuration.
 * @param {object} props - The properties for the ChartLegendContent component.
 * @param {string} [props.className] - Additional class names for the legend container.
 * @param {boolean} [props.hideIcon=false] - Whether to hide the icon for each legend item.
 * @param {any[]} [props.payload] - The data payload for the legend. Provided by Recharts.
 * @param {"top" | "bottom" | "middle"} [props.verticalAlign="bottom"] - The vertical alignment of the legend.
 * @param {string} [props.nameKey] - The key in the payload to use for the item name.
 * @returns {React.JSX.Element | null} The rendered legend content, or null if there is no payload.
 */
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: ChartPayloadItem[];
    verticalAlign?: "top" | "bottom" | "middle";
    hideIcon?: boolean;
    nameKey?: string;
  }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref,
  ) => {
    const { config } = useChart();

    if (!payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className,
        )}
      >
        {(payload || []).map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={String(item.value)}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-xs"
                  style={{
                    backgroundColor: item.color || "transparent",
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
      </div>
    );
  },
);
ChartLegendContent.displayName = "ChartLegend";

/**
 * Extracts the configuration for a specific item from the chart config based on the payload.
 * It intelligently looks for the correct key in the payload to match against the config.
 * @param {ChartConfig} config - The main chart configuration object.
 * @param {unknown} payload - The payload object from Recharts (e.g., from a tooltip or legend).
 * @param {string} key - The primary key to look for in the payload.
 * @returns {object | undefined} The configuration for the item, or undefined if not found.
 */
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload &&
      typeof payload.payload === "object" &&
      payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
