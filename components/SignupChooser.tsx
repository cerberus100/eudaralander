"use client";

import { useRouter } from "next/navigation";
import { Users, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

interface SignupChooserProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignupChooser({ isOpen, onClose }: SignupChooserProps) {
  const router = useRouter();

  const handlePatientSignup = () => {
    onClose();
    router.push("/signup/patient");
  };

  const handleClinicianSignup = () => {
    onClose();
    router.push("/signup/clinician");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-background border border-warm-gray/30">
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-foreground text-center">
            How would you like to get started?
          </DialogTitle>
          <DialogDescription className="text-foreground/70 text-center">
            Choose your path to join the Eudaura community
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Patient Card */}
          <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30 group">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl text-foreground">For Patients</CardTitle>
              <CardDescription className="text-foreground/70">
                Book visits with independent doctors
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 text-sm text-foreground/70 mb-6">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                  Book visits with licensed doctors
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                  View test results & care plans
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                  Secure messaging with providers
                </li>
              </ul>
              <Button
                onClick={handlePatientSignup}
                className="w-full btn-primary"
              >
                Get Started as Patient
              </Button>
            </CardContent>
          </Card>

          {/* Clinician Card */}
          <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30 group">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Stethoscope className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl text-foreground">For Clinicians</CardTitle>
              <CardDescription className="text-foreground/70">
                Join our network of independent doctors
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 text-sm text-foreground/70 mb-6">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                  Set your own availability
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                  Get paid for your expertise
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                  Secure, HIPAA-compliant charting
                </li>
              </ul>
              <Button
                onClick={handleClinicianSignup}
                className="w-full btn-primary"
              >
                Apply as Clinician
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-foreground/60">
            Already have an account?{" "}
            <button
              onClick={onClose}
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
