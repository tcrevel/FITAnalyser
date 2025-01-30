import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type StatRowData = {
  fileName: string;
  avgPower: number;
  weightedPower: number;
  maxPower: number;
  avgHeartRate: number;
  avgCadence: number;
  avgSpeed: number;
  distance: number;
  ascent: number;
};

interface StatsGridProps {
  datasets: Array<{
    name: string;
    data: Array<{
      power: number;
      heartRate: number;
      cadence: number;
      speed: number;
      altitude: number;
    }>;
  }>;
}

function calculateStats(data: Array<any>): StatRowData {
  const powerValues = data.map(d => d.power).filter(Boolean);
  const heartRateValues = data.map(d => d.heartRate).filter(Boolean);
  const cadenceValues = data.map(d => d.cadence).filter(Boolean);
  const speedValues = data.map(d => d.speed).filter(Boolean);
  const altitudeValues = data.map(d => d.altitude).filter(Boolean);

  // Calculate ascent (total positive elevation change)
  let totalAscent = 0;
  for (let i = 1; i < altitudeValues.length; i++) {
    const elevationChange = altitudeValues[i] - altitudeValues[i - 1];
    if (elevationChange > 0) {
      totalAscent += elevationChange;
    }
  }

  // Calculate weighted power (using a simplified algorithm)
  const thirtySecondPower = [];
  const windowSize = 30;
  for (let i = 0; i < powerValues.length - windowSize; i++) {
    const windowPower = powerValues.slice(i, i + windowSize);
    const avgPower = windowPower.reduce((a, b) => a + b, 0) / windowSize;
    thirtySecondPower.push(Math.pow(avgPower, 4));
  }
  const weightedPower = Math.pow(
    thirtySecondPower.reduce((a, b) => a + b, 0) / thirtySecondPower.length,
    0.25
  );

  // Calculate total distance (speed * time in hours)
  const totalDistance = speedValues.reduce((acc, speed) => acc + speed / 3600, 0);

  return {
    fileName: "File",
    avgPower: Math.round(powerValues.reduce((a, b) => a + b, 0) / powerValues.length),
    weightedPower: Math.round(weightedPower),
    maxPower: Math.max(...powerValues),
    avgHeartRate: Math.round(heartRateValues.reduce((a, b) => a + b, 0) / heartRateValues.length),
    avgCadence: Math.round(cadenceValues.reduce((a, b) => a + b, 0) / cadenceValues.length),
    avgSpeed: Math.round((speedValues.reduce((a, b) => a + b, 0) / speedValues.length) * 10) / 10,
    distance: Math.round(totalDistance * 100) / 100,
    ascent: Math.round(totalAscent)
  };
}

export function StatsGrid({ datasets }: StatsGridProps) {
  const stats = datasets.map(dataset => ({
    ...calculateStats(dataset.data),
    fileName: dataset.name
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File name</TableHead>
              <TableHead>Avg Power</TableHead>
              <TableHead>Weighted Power</TableHead>
              <TableHead>Max Power</TableHead>
              <TableHead>Avg HeartRate</TableHead>
              <TableHead>Avg Cadence</TableHead>
              <TableHead>Avg Speed</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Ascent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => (
              <TableRow key={stat.fileName}>
                <TableCell>{stat.fileName}</TableCell>
                <TableCell>{stat.avgPower}w</TableCell>
                <TableCell>{stat.weightedPower}w</TableCell>
                <TableCell>{stat.maxPower}w</TableCell>
                <TableCell>{stat.avgHeartRate}bpm</TableCell>
                <TableCell>{stat.avgCadence}rpm</TableCell>
                <TableCell>{stat.avgSpeed}km/h</TableCell>
                <TableCell>{stat.distance}km</TableCell>
                <TableCell>{stat.ascent}m</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}