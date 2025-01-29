import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";

// TODO: Replace with actual type from backend
type FitFile = {
  id: string;
  name: string;
  createdAt: string;
};

// TODO: Replace with actual data from backend
const mockData: FitFile[] = [
  { id: "1", name: "Morning Ride.fit", createdAt: "2025-01-29T10:00:00Z" },
  { id: "2", name: "Evening Workout.fit", createdAt: "2025-01-29T18:30:00Z" },
];

export function FitFilesGrid() {
  const handleView = (id: string) => {
    // TODO: Implement view action
    console.log("View file:", id);
  };

  const handleDelete = (id: string) => {
    // TODO: Implement delete action
    console.log("Delete file:", id);
  };

  return (
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
          {mockData.map((file) => (
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
                    onClick={() => handleView(file.id)}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
