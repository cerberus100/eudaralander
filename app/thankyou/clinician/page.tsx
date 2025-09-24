import { CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function ClinicianThankYou() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
            Thank You for Your Application!
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            We've received your application to join the Eudaura network. Our team will review your credentials and contact you within 2-3 business days.
          </p>
        </div>

        <Card className="card-premium mb-8">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">What Happens Next?</CardTitle>
            <CardDescription>
              Our credentialing process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Review</h3>
                <p className="text-sm text-foreground/70">
                  Our team reviews your NPI, license, and qualifications
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Verification</h3>
                <p className="text-sm text-foreground/70">
                  We verify your credentials with state medical boards
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Invite</h3>
                <p className="text-sm text-foreground/70">
                  You'll receive an email invitation to activate your account
                </p>
              </div>
            </div>

            <div className="bg-primary/5 rounded-lg p-6 text-center">
              <h4 className="font-semibold text-foreground mb-2">Questions?</h4>
              <p className="text-sm text-foreground/70 mb-4">
                If you have any questions about your application or the process, please don't hesitate to reach out.
              </p>
              <Button variant="outline" className="btn-secondary">
                <a href="mailto:provider@eudaura.com">Contact Provider Support</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-foreground/70">
            In the meantime, you can learn more about Eudaura:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline" className="btn-secondary">
              <Link href="/">Return to Home</Link>
            </Button>
            <Button asChild className="btn-primary">
              <Link href="/for-clinicians">Learn More About Eudaura</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
