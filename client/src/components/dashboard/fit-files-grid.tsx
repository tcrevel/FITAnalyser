import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Plus, Trash2, Settings, Upload, Share2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { DatasetEditModal } from "./dataset-edit-modal";
import { useAuthStore } from "@/lib/auth";
import { getAuth } from "firebase/auth";

type Dataset = {
  id: string;
  name: string;
  createdAt: string;
  fitFiles: Array<{
    id: string;
    name: string;
    filePath: string;
  }>;
};

async function uploadDataset(formData: FormData) {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch("/api/fit-files", {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to upload files");
  }

  return response.json();
}

async function deleteDataset(id: string) {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`/api/fit-files/${id}`, {
    method: "DELETE",
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete dataset");
  }
  return response.json();
}

export function FitFilesGrid() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<string | null>(null);

  const { data: datasets = [], isLoading } = useQuery<Dataset[]>({
    queryKey: ["datasets"],
    queryFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/fit-files", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch datasets");
      }
      return response.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDataset,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
      setUploadDialogOpen(false);
      // Navigate to the dataset view
      if (data?.id) {
        setLocation(`/dashboard/dataset/${data.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      toast({
        title: "Success",
        description: "Dataset deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDatasetToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete dataset",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setDatasetToDelete(null);
    },
  });

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData();

    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    const nameInput = form.querySelector<HTMLInputElement>('input[name="name"]');

    if (fileInput?.files && fileInput.files.length > 0) {
      Array.from(fileInput.files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('name', nameInput?.value || 'New Dataset');
    }

    await uploadMutation.mutateAsync(formData);
    form.reset();
  };

  const handleDeleteClick = (id: string) => {
    setDatasetToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (datasetToDelete !== null) {
      await deleteMutation.mutateAsync(datasetToDelete);
    }
  };

  const handleShare = async (datasetId: string) => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/fit-files/${datasetId}/share`, {
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


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Datasets</h2>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Dataset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload FIT Files</DialogTitle>
              <DialogDescription>
                Select multiple .fit files and provide a name for your dataset.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Dataset Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Enter a name for this dataset"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">FIT Files</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept=".fit"
                  required
                  multiple
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold hover:file:bg-violet-100 file:bg-violet-50 file:text-violet-700"
                />
                <p className="text-sm text-muted-foreground">
                  Select multiple .fit files to compare in this dataset
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={uploadMutation.isPending}>
                <Upload className="h-4 w-4 mr-2" />
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dataset Name</TableHead>
              <TableHead>Files</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : datasets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No datasets found
                </TableCell>
              </TableRow>
            ) : (
              datasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell className="font-medium">{dataset.name}</TableCell>
                  <TableCell>{dataset.fitFiles.length} files</TableCell>
                  <TableCell>
                    {format(new Date(dataset.createdAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation(`/dashboard/dataset/${dataset.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShare(dataset.id)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingDataset(dataset)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(dataset.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingDataset && (
        <DatasetEditModal
          open={!!editingDataset}
          onOpenChange={(open) => !open && setEditingDataset(null)}
          dataset={editingDataset}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dataset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this dataset and all its files? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDatasetToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}