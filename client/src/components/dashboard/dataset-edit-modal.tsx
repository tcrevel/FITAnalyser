import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Trash2, Upload, Check } from "lucide-react";
import { getAuth } from "firebase/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DatasetEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataset: {
    id: string;
    name: string;
    fitFiles: Array<{
      id: string;
      name: string;
    }>;
  };
}

export function DatasetEditModal({ open, onOpenChange, dataset }: DatasetEditModalProps) {
  const [name, setName] = useState(dataset.name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Query to keep dataset data fresh
  const { data: currentDataset } = useQuery({
    queryKey: ["datasets", dataset.id],
    queryFn: async () => {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/fit-files/${dataset.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch dataset");
      }
      return response.json();
    },
    enabled: open, // Only fetch when modal is open
  });

  const handleUpdateDataset = async () => {
    try {
      setIsUpdating(true);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/fit-files/${dataset.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to update dataset");
      }

      await queryClient.invalidateQueries({ queryKey: ["datasets"] });
      toast({
        title: "Success",
        description: "Dataset updated successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadFiles = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');

    if (!fileInput?.files?.length) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      Array.from(fileInput.files).forEach(file => {
        formData.append('files', file);
      });

      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/fit-files/${dataset.id}/upload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      await queryClient.invalidateQueries({ queryKey: ["datasets", dataset.id] });
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/fit-files/${dataset.id}/file/${fileId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      await queryClient.invalidateQueries({ queryKey: ["datasets", dataset.id] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Use the current dataset data from the query if available, otherwise use the prop
  const displayedDataset = currentDataset || dataset;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex flex-col h-[80vh] max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Dataset</DialogTitle>
            <DialogDescription>
              Update dataset name and manage uploaded files.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-1">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Dataset Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter dataset name"
                />
              </div>

              <form onSubmit={handleUploadFiles} className="space-y-2">
                <Label htmlFor="files">Upload Files</Label>
                <div className="flex gap-2">
                  <Input
                    id="files"
                    name="files"
                    type="file"
                    accept=".fit"
                    multiple
                    required
                    className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                             file:text-sm file:font-semibold file:bg-primary/10 file:text-primary 
                             hover:file:bg-primary/20"
                  />
                  <Button type="submit" disabled={isUploading} className="flex-shrink-0">
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </form>

              <div className="space-y-2">
                <Label>Uploaded Files</Label>
                <div className="rounded-md border">
                  <div className="p-2 space-y-2">
                    {displayedDataset.fitFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-md border p-2 hover:bg-accent"
                      >
                        <span className="text-sm truncate flex-1 mr-2">{file.name}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete File</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this file? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFile(file.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDataset} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}