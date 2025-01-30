import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricGraph } from "@/components/dashboard/metric-graph";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type FitFile = {
  id: string;
  name: string;
  filePath: string;
};

type Dataset = {
  id: string;
  name: string;
  createdAt: string;
  fitFiles: FitFile[];
};

type DataPoint = {
  index: number;
  power: number;
  cadence: number;
  heartRate: number;
  speed: number;
  altitude: number;
  timestamp: string;
};

type ProcessedDataSet = {
  name: string;
  data: DataPoint[];
};

export default function SharedDatasetView() {
  const { toast } = useToast();
  const [, params] = useRoute("/shared/:token");
  const token = params?.token;
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  const { data: dataset, isLoading: isLoadingDataset } = useQuery<Dataset>({
    queryKey: ["shared-dataset", token],
    queryFn: async () => {
      const response = await fetch(`/api/fit-files/shared/${token}`);
      if (!response.ok) {
        throw new Error("Failed to fetch dataset");
      }
      return response.json();
    },
    enabled: !!token,
  });

  const { data: fileData = [], isLoading: isLoadingData } = useQuery<ProcessedDataSet[]>({
    queryKey: ["shared-fit-files-data", selectedFileIds, token],
    queryFn: async () => {
      const dataPromises = selectedFileIds.map(async fileId => {
        const file = dataset?.fitFiles.find(f => f.id === fileId);
        if (!file) return null;

        const response = await fetch(`/api/fit-files/shared/${token}/file/${fileId}/data`);
        if (!response.ok) {
          throw new Error("Failed to fetch file data");
        }

        const data = await response.json();
        return {
          name: file.name,
          data,
        };
      });

      const results = await Promise.all(dataPromises);
      return results.filter((result): result is ProcessedDataSet => result !== null);
    },
    enabled: selectedFileIds.length > 0 && !!dataset && !!token,
  });

  useEffect(() => {
    if (dataset?.fitFiles) {
      setSelectedFileIds(dataset.fitFiles.map(f => f.id));
    }
  }, [dataset]);

  const isLoading = isLoadingDataset || isLoadingData;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-1/4 bg-muted rounded"></div>
          <div className="h-8 w-1/2 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dataset not found</h1>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{dataset.name}</h1>
        <p className="text-sm text-muted-foreground">
          Shared dataset view
        </p>
      </div>

      <div className="grid gap-6">
        <MetricGraph
          datasets={fileData}
          metricKey="power"
          title="Power Comparison"
          color="#ef4444"
          unit="watts"
        />

        <MetricGraph
          datasets={fileData}
          metricKey="heartRate"
          title="Heart Rate Comparison"
          color="#ec4899"
          unit="bpm"
        />

        <MetricGraph
          datasets={fileData}
          metricKey="speed"
          title="Speed Comparison"
          color="#3b82f6"
          unit="km/h"
        />

        <MetricGraph
          datasets={fileData}
          metricKey="cadence"
          title="Cadence Comparison"
          color="#10b981"
          unit="rpm"
        />

        <MetricGraph
          datasets={fileData}
          metricKey="altitude"
          title="Elevation Comparison"
          color="#8b5cf6"
          unit="m"
        />
      </div>
    </div>
  );
}