import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricGraph } from "@/components/dashboard/metric-graph";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

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
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);

  // Get all available datasets
  const { data: files = [], isLoading: isLoadingFiles } = useQuery<FitFile[]>({
    queryKey: ["fit-files"],
    queryFn: () => fetch("/api/fit-files").then(res => res.json()),
  });

  // Set initial selection when files load
  useEffect(() => {
    if (id && !selectedFileIds.includes(parseInt(id))) {
      setSelectedFileIds([parseInt(id)]);
    }
  }, [id, files]);

  // Get data only for selected files
  const { data: datasets = [], isLoading: isLoadingData } = useQuery<ProcessedDataSet[]>({
    queryKey: ["fit-files-data", selectedFileIds],
    queryFn: async () => {
      const dataPromises = selectedFileIds.map(async fileId => {
        const file = files.find(f => f.id === fileId);
        if (!file) return null;
        const response = await fetch(`/api/fit-files/${fileId}/data`);
        const data = await response.json();
        return {
          name: file.name,
          data,
        };
      });
      const results = await Promise.all(dataPromises);
      return results.filter((result): result is ProcessedDataSet => result !== null);
    },
    enabled: selectedFileIds.length > 0 && files.length > 0,
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

  const handleFileSelection = (fileId: number) => {
    setSelectedFileIds(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      }
      return [...prev, fileId];
    });
  };

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
          <CardTitle>Select Datasets to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map(file => (
              <div key={file.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`file-${file.id}`}
                  checked={selectedFileIds.includes(file.id)}
                  onCheckedChange={() => handleFileSelection(file.id)}
                />
                <Label htmlFor={`file-${file.id}`}>{file.name}</Label>
              </div>
            ))}
          </div>
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