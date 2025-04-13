import * as React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar as RechartsBar,
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from "recharts";
import { cn } from "@/lib/utils";

export interface ChartConfig {
  [k in string]: {
    label?: React.ReactNode;
    color?: string;
  };
}

interface ChartContextProps {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextProps>({
  config: {},
});

export function getPayloadColor(config: ChartConfig, payload: Record<string, any>) {
  const key = Object.keys(payload).find(
    (key) => key !== "name" && key !== "time" && payload[key] !== undefined
  );

  if (!key) return undefined;
  return config[key]?.color;
}

export function Line({
  data,
  config,
  className,
  ...props
}: {
  data: Record<string, any>[];
  config: ChartConfig;
  className?: string;
} & Omit<React.ComponentProps<typeof LineChart>, "data" | "className" | "children">) {
  const dataKeys = Object.keys(data[0] || {}).filter(
    (key) => key !== "name" && key !== "time"
  );

  return (
    <ChartContext.Provider value={{ config }}>
      <ResponsiveContainer width="100%" height="100%" className={cn("", className)}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }} {...props}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            className="text-xs"
            stroke="currentColor"
            strokeOpacity={0.5}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            className="text-xs"
            stroke="currentColor"
            strokeOpacity={0.5}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;

              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-flow-col gap-2">
                    {payload.map((item: any) => {
                      const key = item.dataKey;
                      return (
                        <div className="flex flex-col gap-1" key={key}>
                          <div className="flex items-center gap-1">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs font-medium">
                              {config[key]?.label || key}
                            </span>
                          </div>
                          <span className="text-xs font-bold">
                            {item.value ?? "N/A"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
          />
          {dataKeys.map((key) => (
            <RechartsLine
              key={key}
              type="monotone"
              dataKey={key}
              className="origin-bottom transition-all ease-in-out hover:opacity-70"
              activeDot={{ r: 4 }}
              stroke={config[key]?.color}
              strokeWidth={1.5}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContext.Provider>
  );
}

export function Bar({
  data,
  config,
  className,
  ...props
}: {
  data: Record<string, any>[];
  config: ChartConfig;
  className?: string;
} & Omit<React.ComponentProps<typeof BarChart>, "data" | "className" | "children">) {
  const dataKeys = Object.keys(data[0] || {}).filter(
    (key) => key !== "name" && key !== "time"
  );

  return (
    <ChartContext.Provider value={{ config }}>
      <ResponsiveContainer width="100%" height="100%" className={cn("", className)}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }} {...props}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            className="text-xs"
            stroke="currentColor"
            strokeOpacity={0.5}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            className="text-xs"
            stroke="currentColor"
            strokeOpacity={0.5}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;

              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-flow-col gap-2">
                    {payload.map((item: any) => {
                      const key = item.dataKey;
                      return (
                        <div className="flex flex-col gap-1" key={key}>
                          <div className="flex items-center gap-1">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs font-medium">
                              {config[key]?.label || key}
                            </span>
                          </div>
                          <span className="text-xs font-bold">
                            {item.value ?? "N/A"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
          />
          {dataKeys.map((key) => (
            <RechartsBar
              key={key}
              dataKey={key}
              className="origin-bottom transition-all ease-in-out hover:opacity-70"
              fill={config[key]?.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContext.Provider>
  );
}

export function Area({
  data,
  config,
  className,
  ...props
}: {
  data: Record<string, any>[];
  config: ChartConfig;
  className?: string;
} & Omit<React.ComponentProps<typeof AreaChart>, "data" | "className" | "children">) {
  const dataKeys = Object.keys(data[0] || {}).filter(
    (key) => key !== "name" && key !== "time"
  );

  return (
    <ChartContext.Provider value={{ config }}>
      <ResponsiveContainer width="100%" height="100%" className={cn("", className)}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }} {...props}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            className="text-xs"
            stroke="currentColor"
            strokeOpacity={0.5}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            className="text-xs"
            stroke="currentColor"
            strokeOpacity={0.5}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;

              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-flow-col gap-2">
                    {payload.map((item: any) => {
                      const key = item.dataKey;
                      return (
                        <div className="flex flex-col gap-1" key={key}>
                          <div className="flex items-center gap-1">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs font-medium">
                              {config[key]?.label || key}
                            </span>
                          </div>
                          <span className="text-xs font-bold">
                            {item.value ?? "N/A"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
          />
          {dataKeys.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              className="origin-bottom transition-all ease-in-out hover:opacity-70"
              stroke={config[key]?.color}
              fill={config[key]?.color}
              strokeWidth={1.5}
              fillOpacity={0.2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContext.Provider>
  );
}