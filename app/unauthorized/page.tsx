import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-md">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-foreground/70">
            You don&apos;t have permission to access this page
          </p>
        </div>

        <Card className="card-premium">
          <CardHeader className="text-center">
            <CardTitle>Unauthorized Access</CardTitle>
            <CardDescription>
              This page requires admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-foreground/70">
              If you&apos;re an administrator, please sign in with your admin credentials.
            </p>
            
            <div className="space-y-4">
              <Button asChild className="w-full btn-primary">
                <Link href="/login">Sign In as Admin</Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full btn-secondary">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
