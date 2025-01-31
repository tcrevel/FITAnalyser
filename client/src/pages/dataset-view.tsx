import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft, Settings, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricGraph } from "@/components/dashboard/metric-graph";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { DatasetEditModal } from "@/components/dashboard/dataset-edit-modal";
import { getAuth } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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
          Authorization: `Bearer ${token}`,
        },
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

      console.log("Fetching data for files:", selectedFileIds); // Debug log

      const dataPromises = selectedFileIds.map(async (fileId) => {
        const file = dataset?.fitFiles.find((f) => f.id === fileId);
        if (!file) {
          console.log("File not found in dataset:", fileId); // Debug log
          return null;
        }

        console.log("Fetching data for file:", file.name, fileId); // Debug log

        const response = await fetch(`/api/fit-files/file/${fileId}/data`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch file data:", fileId, await response.text()); // Debug log
          throw new Error("Failed to fetch file data");
        }

        const data = await response.json();
        console.log("Received data for file:", file.name, "records:", data.length); // Debug log

        if (!Array.isArray(data) || data.length === 0) {
          console.log("No data or invalid data received for file:", file.name); // Debug log
          return null;
        }

        return {
          name: file.name,
          data,
        };
      });

      const results = await Promise.all(dataPromises);
      const validResults = results.filter((result): result is ProcessedDataSet => result !== null);
      console.log("Total valid datasets:", validResults.length); // Debug log
      return validResults;
    },
    enabled: selectedFileIds.length > 0 && !!dataset,
  });

  useEffect(() => {
    if (dataset?.fitFiles) {
      setSelectedFileIds(dataset.fitFiles.map((f) => f.id));
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
          Authorization: `Bearer ${token}`,
        },
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

  const handleExportPNG = async () => {
    if (!contentRef.current) return;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `${dataset?.name || 'dataset'}-export.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: "Success",
        description: "Dataset exported as PNG successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to export as PNG",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!contentRef.current) return;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${dataset?.name || 'dataset'}-export.pdf`);

      toast({
        title: "Success",
        description: "Dataset exported as PDF successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to export as PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
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
    setSelectedFileIds((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId);
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
            onClick={handleExportPNG}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PNG
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Dataset
          </Button>
          <Button variant="outline" onClick={() => setEditModalOpen(true)}>
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
            {dataset.fitFiles.map((file) => (
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

      <div ref={contentRef}>
        {fileData.length > 0 && <StatsGrid datasets={fileData} />}

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
    </div>
  );
}