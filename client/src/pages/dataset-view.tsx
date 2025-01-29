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

export default function DatasetView() {
  const [, params] = useRoute("/dashboard/dataset/:id");
  const id = params?.id;

  const { data: dataset, isLoading: isLoadingDataset } = useQuery<FitFile>({
    queryKey: ["fit-files", id],
    queryFn: () => fetch(`/api/fit-files/${id}`).then(res => res.json()),
    enabled: !!id,
  });

  const { data: fitData, isLoading: isLoadingData } = useQuery<DataPoint[]>({
    queryKey: ["fit-files", id, "data"],
    queryFn: () => fetch(`/api/fit-files/${id}/data`).then(res => res.json()),
    enabled: !!id,
  });

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

  if (!dataset || !fitData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dataset not found</h1>
        <Link href="/dashboard">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{dataset.name}</h1>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dataset Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Created</p>
            <p>{format(new Date(dataset.createdAt), "PPP p")}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">File Path</p>
            <p className="font-mono text-sm">{dataset.filePath}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {/* Power Graph */}
        <MetricGraph
          data={fitData}
          metricKey="power"
          title="Power"
          color="#ef4444"
          unit="watts"
        />

        {/* Heart Rate Graph */}
        <MetricGraph
          data={fitData}
          metricKey="heartRate"
          title="Heart Rate"
          color="#ec4899"
          unit="bpm"
        />

        {/* Speed Graph */}
        <MetricGraph
          data={fitData}
          metricKey="speed"
          title="Speed"
          color="#3b82f6"
          unit="km/h"
        />

        {/* Cadence Graph */}
        <MetricGraph
          data={fitData}
          metricKey="cadence"
          title="Cadence"
          color="#10b981"
          unit="rpm"
        />

        {/* Elevation Graph */}
        <MetricGraph
          data={fitData}
          metricKey="altitude"
          title="Elevation"
          color="#8b5cf6"
          unit="m"
        />
      </div>
    </div>
  );
}