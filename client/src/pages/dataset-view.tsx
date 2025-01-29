import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricGraph } from "@/components/dashboard/metric-graph";

type FitFile = {
  id: number;
  name: string;
  createdAt: string;
  filePath: string;
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

export default function DatasetView() {
  const [, params] = useRoute("/dashboard/dataset/:id");
  const id = params?.id;

  // Get all available datasets
  const { data: files = [], isLoading: isLoadingFiles } = useQuery<FitFile[]>({
    queryKey: ["fit-files"],
    queryFn: () => fetch("/api/fit-files").then(res => res.json()),
  });

  // Get data for all files
  const { data: datasets = [], isLoading: isLoadingData } = useQuery<ProcessedDataSet[]>({
    queryKey: ["fit-files-data", files.map(f => f.id)],
    queryFn: async () => {
      const dataPromises = files.map(async file => {
        const response = await fetch(`/api/fit-files/${file.id}/data`);
        const data = await response.json();
        return {
          name: file.name,
          data,
        };
      });
      return Promise.all(dataPromises);
    },
    enabled: files.length > 0,
  });

  const isLoading = isLoadingFiles || isLoadingData;

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

  if (files.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">No datasets found</h1>
        <Link href="/dashboard">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // Find the current dataset
  const currentDataset = files.find(f => f.id === parseInt(id || ""));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {currentDataset ? currentDataset.name : 'Dataset Comparison'}
        </h1>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datasets Being Compared</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {datasets.map(dataset => (
              <li key={dataset.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>{dataset.name}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <MetricGraph
          datasets={datasets}
          metricKey="power"
          title="Power Comparison"
          color="#ef4444"
          unit="watts"
        />

        <MetricGraph
          datasets={datasets}
          metricKey="heartRate"
          title="Heart Rate Comparison"
          color="#ec4899"
          unit="bpm"
        />

        <MetricGraph
          datasets={datasets}
          metricKey="speed"
          title="Speed Comparison"
          color="#3b82f6"
          unit="km/h"
        />

        <MetricGraph
          datasets={datasets}
          metricKey="cadence"
          title="Cadence Comparison"
          color="#10b981"
          unit="rpm"
        />

        <MetricGraph
          datasets={datasets}
          metricKey="altitude"
          title="Elevation Comparison"
          color="#8b5cf6"
          unit="m"
        />
      </div>
    </div>
  );
}