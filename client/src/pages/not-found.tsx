import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20">
      <div className="text-center space-y-6 p-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-2">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-foreground">404 Page Not Found</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you are looking for does not exist or has been moved. 
          Return to the dashboard to view sales analytics.
        </p>

        <Link href="/">
          <Button size="lg" className="font-semibold">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
