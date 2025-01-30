import { useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DataPoint = {
  index: number;
  power: number;
  cadence: number;
  heartRate: number;
  speed: number;
  altitude: number;
  timestamp: string;
};

type Dataset = {
  name: string;
  data: DataPoint[];
};

interface MetricGraphProps {
  datasets: Dataset[];
  metricKey: keyof DataPoint;
  title: string;
  color: string;
  unit: string;
}

// Generate a color palette for multiple datasets
const colors = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Green
  "#8b5cf6", // Purple
  "#f59e0b", // Yellow
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

export function MetricGraph({ datasets, metricKey, title, unit }: MetricGraphProps) {
  console.log("MetricGraph render:", { datasets, metricKey, title });

  const [refAreaLeft, setRefAreaLeft] = useState("");
  const [refAreaRight, setRefAreaRight] = useState("");
  const [left, setLeft] = useState<number | "dataMin">("dataMin");
  const [right, setRight] = useState<number | "dataMax">("dataMax");
  const [top, setTop] = useState<number | "dataMax">("dataMax");
  const [bottom, setBottom] = useState<number | "dataMin">("dataMin");

  // Process and validate data
  const validDatasets = datasets.filter(dataset => 
    dataset && Array.isArray(dataset.data) && dataset.data.length > 0
  );

  console.log("Valid datasets:", validDatasets.length);

  const zoom = useCallback(() => {
    if (refAreaLeft === refAreaRight || !refAreaRight) {
      setRefAreaLeft("");
      setRefAreaRight("");
      return;
    }

    const leftNum = parseInt(refAreaLeft);
    const rightNum = parseInt(refAreaRight);

    if (isNaN(leftNum) || isNaN(rightNum)) {
      setRefAreaLeft("");
      setRefAreaRight("");
      return;
    }

    let [finalLeft, finalRight] = leftNum > rightNum ? [rightNum, leftNum] : [leftNum, rightNum];

    // Find min and max values across all datasets in the selected range
    const allValues = validDatasets.flatMap(dataset => 
      dataset.data
        .filter((_, index) => index >= finalLeft && index <= finalRight)
        .map(d => Number(d[metricKey]))
        .filter(val => !isNaN(val))
    );

    if (allValues.length === 0) {
      setRefAreaLeft("");
      setRefAreaRight("");
      return;
    }

    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);

    setRefAreaLeft("");
    setRefAreaRight("");
    setLeft(finalLeft);
    setRight(finalRight);
    setBottom(minValue);
    setTop(maxValue);
  }, [validDatasets, metricKey, refAreaLeft, refAreaRight]);

  const zoomOut = () => {
    setLeft("dataMin");
    setRight("dataMax");
    setTop("dataMax");
    setBottom("dataMin");
  };

  if (validDatasets.length === 0) {
    console.log("No valid data available for chart");
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>{title}</span>
          <button
            className="text-sm text-muted-foreground hover:text-primary"
            onClick={zoomOut}
          >
            Reset Zoom
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel || "")}
              onMouseMove={(e) =>
                refAreaLeft && e && setRefAreaRight(e.activeLabel || "")
              }
              onMouseUp={zoom}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                allowDataOverflow
                domain={[left, right]}
                type="number"
                dataKey="index"
                label={{ value: "Time (s)", position: "bottom" }}
              />
              <YAxis
                allowDataOverflow
                domain={[bottom, top]}
                type="number"
                label={{ value: unit, angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} ${unit}`,
                  name,
                ]}
              />
              <Legend />
              {validDatasets.map((dataset, index) => (
                <Line
                  key={dataset.name}
                  data={dataset.data}
                  type="monotone"
                  name={dataset.name}
                  dataKey={metricKey}
                  stroke={colors[index % colors.length]}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
              {refAreaLeft && refAreaRight ? (
                <ReferenceArea
                  x1={refAreaLeft}
                  x2={refAreaRight}
                  strokeOpacity={0.3}
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}