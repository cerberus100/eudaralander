import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
        <p className="text-foreground/70 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist. You may have mistyped the address or the page may have moved.
        </p>
        <Button asChild className="btn-primary">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Go to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}
