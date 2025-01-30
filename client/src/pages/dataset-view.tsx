import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft, Settings, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricGraph } from "@/components/dashboard/metric-graph";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { DatasetEditModal } from "@/components/dashboard/dataset-edit-modal";
import { getAuth } from "firebase/auth";
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

export default function DatasetView() {
  const { toast } = useToast();
  const [, params] = useRoute("/dashboard/dataset/:id");
  const id = params?.id;
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: dataset, isLoading: isLoadingDataset } = useQuery<Dataset>({
    queryKey: ["datasets", id],
    queryFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/fit-files/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch dataset");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const { data: fileData = [], isLoading: isLoadingData } = useQuery<ProcessedDataSet[]>({
    queryKey: ["fit-files-data", selectedFileIds],
    queryFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const dataPromises = selectedFileIds.map(async fileId => {
        const file = dataset?.fitFiles.find(f => f.id === fileId);
        if (!file) return null;

        const response = await fetch(`/api/fit-files/file/${fileId}/data`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

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
    enabled: selectedFileIds.length > 0 && !!dataset,
  });

  useEffect(() => {
    if (dataset?.fitFiles) {
      setSelectedFileIds(dataset.fitFiles.map(f => f.id));
    }
  }, [dataset]);

  const isLoading = isLoadingDataset || isLoadingData;

  const handleShare = async () => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/fit-files/${id}/share`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to share dataset");
      }

      const { shareToken } = await response.json();
      const shareUrl = `${window.location.origin}/shared/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "Link copied!",
        description: "Share this link with others to view this dataset.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };


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
        <Link href="/dashboard">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const handleFileSelection = (fileId: string) => {
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
        <h1 className="text-2xl font-bold">{dataset?.name}</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Dataset
          </Button>
          <Button 
            variant="outline"
            onClick={() => setEditModalOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Dataset
          </Button>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {dataset && (
        <DatasetEditModal 
          open={editModalOpen} 
          onOpenChange={setEditModalOpen}
          dataset={dataset}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Files to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataset.fitFiles.map(file => (
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