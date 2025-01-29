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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricGraphProps {
  data: any[];
  metricKey: string;
  title: string;
  color: string;
  unit: string;
}

export function MetricGraph({ data, metricKey, title, color, unit }: MetricGraphProps) {
  const [refAreaLeft, setRefAreaLeft] = useState("");
  const [refAreaRight, setRefAreaRight] = useState("");
  const [left, setLeft] = useState<number | "dataMin">("dataMin");
  const [right, setRight] = useState<number | "dataMax">("dataMax");
  const [top, setTop] = useState<number | "dataMax">("dataMax");
  const [bottom, setBottom] = useState<number | "dataMin">("dataMin");

  const zoom = () => {
    if (refAreaLeft === refAreaRight || !refAreaRight) {
      setRefAreaLeft("");
      setRefAreaRight("");
      return;
    }

    let leftNum = parseInt(refAreaLeft);
    let rightNum = parseInt(refAreaRight);

    if (leftNum > rightNum) {
      [leftNum, rightNum] = [rightNum, leftNum];
    }

    const dataInRange = data.filter(
      (_, index) => index >= leftNum && index <= rightNum
    );

    const maxValue = Math.max(...dataInRange.map((d) => d[metricKey]));
    const minValue = Math.min(...dataInRange.map((d) => d[metricKey]));

    setRefAreaLeft("");
    setRefAreaRight("");
    setLeft(leftNum);
    setRight(rightNum);
    setBottom(minValue);
    setTop(maxValue);
  };

  const zoomOut = () => {
    setLeft("dataMin");
    setRight("dataMax");
    setTop("dataMax");
    setBottom("dataMin");
  };

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
              data={data}
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
              <Tooltip />
              <Line
                type="monotone"
                dataKey={metricKey}
                stroke={color}
                dot={false}
                isAnimationActive={false}
              />
              {refAreaLeft && refAreaRight ? (
                <ReferenceArea
                  x1={refAreaLeft}
                  x2={refAreaRight}
                  strokeOpacity={0.3}
                  fill={color}
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
