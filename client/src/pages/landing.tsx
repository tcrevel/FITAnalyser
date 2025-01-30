import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LucideBarChart2, FileHeart, Share2, Download, BarChart3, ChevronRight, Database } from "lucide-react";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-3 flex items-center justify-between border-b">
        <h1 className="text-xl font-bold">FIT Compare</h1>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-6 text-center space-y-6 bg-gradient-to-b from-primary/5 to-background">
          <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
            Compare Your Cycling Workouts
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced .FIT file analysis tool for cyclists, coaches, and data analysts. 
            Track performance, gain insights, and improve your training.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid gap-8 max-w-5xl mx-auto md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-lg border bg-card">
              <FileHeart className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">FIT File Analysis</h3>
              <p className="text-muted-foreground">
                Upload and analyze multiple .FIT files simultaneously. Compare power, heart rate, cadence, and more.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-lg border bg-card">
              <LucideBarChart2 className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Performance Metrics</h3>
              <p className="text-muted-foreground">
                Track key performance indicators including weighted power, elevation gain, and detailed statistics.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-lg border bg-card">
              <Share2 className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Easy Sharing</h3>
              <p className="text-muted-foreground">
                Share your workout analysis with coaches or teammates using secure, shareable links.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-lg border bg-card">
              <Download className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Export Options</h3>
              <p className="text-muted-foreground">
                Export your analysis as PNG or PDF files for documentation and sharing.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-lg border bg-card">
              <BarChart3 className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Visual Insights</h3>
              <p className="text-muted-foreground">
                Interactive graphs and charts for detailed workout comparison and analysis.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-lg border bg-card">
              <Database className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Data Management</h3>
              <p className="text-muted-foreground">
                Organize your workouts into datasets for efficient comparison and long-term progress tracking.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-primary/5">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to Analyze Your Workouts?</h2>
            <p className="text-xl text-muted-foreground">
              Join now and start comparing your cycling workouts with our advanced analysis tools.
            </p>
            <Link href="/login">
              <Button size="lg" className="mt-4">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t py-6 px-6">
        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FIT Compare. All rights reserved.
        </div>
      </footer>
    </div>
  );
}