import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Plus, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

type FitFile = {
  id: number;
  name: string;
  createdAt: string;
  filePath: string;
};

async function uploadFitFiles(formData: FormData) {
  const response = await fetch("/api/fit-files", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Failed to upload files");
  }
  return response.json();
}

async function deleteFitFile(id: number) {
  const response = await fetch(`/api/fit-files/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete file");
  }
  return response.json();
}

export function FitFilesGrid() {
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery<FitFile[]>({
    queryKey: ["fit-files"],
    queryFn: () => fetch("/api/fit-files").then(res => res.json()),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFitFiles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fit-files"] });
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
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
    mutationFn: deleteFitFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fit-files"] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData();

    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    const nameInput = form.querySelector<HTMLInputElement>('input[name="name"]');

    if (fileInput?.files) {
      Array.from(fileInput.files).forEach((file, index) => {
        formData.append('files', file);
        // If multiple files, append index to name
        const baseName = nameInput?.value || 'Dataset';
        const name = fileInput.files.length > 1 ? `${baseName} ${index + 1}` : baseName;
        formData.append('names[]', name);
      });
    }

    await uploadMutation.mutateAsync(formData);
    form.reset();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this file?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Datasets</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Datasets
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload FIT Files</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Dataset Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  required 
                  placeholder="For multiple files, this will be the base name"
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
                  You can select multiple .fit files
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
              <TableHead>Created Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No datasets found
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell>
                    {format(new Date(file.createdAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // TODO: Implement view action
                          console.log("View file:", file.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(file.id)}
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
    </div>
  );
}