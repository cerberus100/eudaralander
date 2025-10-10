"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const verifySchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits").regex(/^\d+$/, "Code must contain only digits"),
});

type VerifyFormData = z.infer<typeof verifySchema>;

function VerifyPageContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contact, setContact] = useState<string>("");
  const [requestId, setRequestId] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const contactParam = searchParams.get('contact');
    const requestIdParam = searchParams.get('requestId');
    
    // Try URL params first
    if (contactParam) {
      setContact(contactParam);
    }
    if (requestIdParam) {
      setRequestId(requestIdParam);
    }
    
    // Fallback to localStorage if not in URL
    if (!requestIdParam) {
      const savedRequestId = localStorage.getItem('verificationRequestId');
      if (savedRequestId) {
        setRequestId(savedRequestId);
      }
    }
    if (!contactParam) {
      const savedContact = localStorage.getItem('verificationContact');
      if (savedContact) {
        setContact(savedContact);
      }
    }
  }, [searchParams]);

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: VerifyFormData) => {
    if (!requestId) {
      toast.error("Missing verification information. Please register again.");
      router.push('/signup/patient');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://eudaura.com/api/patient/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,  // Changed from contact to requestId
          code: data.code,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Verification successful!", {
          description: "Your account has been activated.",
        });

        // Clear localStorage
        localStorage.removeItem('verificationRequestId');
        localStorage.removeItem('verificationContact');

        // Redirect to onboarding
        router.push(result.next);
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error instanceof Error ? error.message : "Please check your code and try again";
      
      if (errorMessage.includes("expired")) {
        toast.error("Verification code expired", {
          description: "Your code has expired. Please register again to receive a new code.",
          action: {
            label: "Register Again",
            onClick: () => router.push('/signup/patient')
          }
        });
      } else {
        toast.error("Verification failed", {
          description: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (!contact) {
      toast.error("Missing contact information");
      return;
    }

    try {
      const response = await fetch('https://eudaura.com/api/patient/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          contact: contact || '',  // Keep contact for email resend
          requestId: requestId  // Add requestId for future use
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend code');
      }

      const result = await response.json();
      
      toast.success("Verification code resent!", {
        description: `Check your ${contact.includes('@') ? 'email' : 'phone'} for the new code.`,
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error("Failed to resend code", {
        description: error instanceof Error ? error.message : "Please try again later",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Verify Your Account
          </h1>
          <p className="text-foreground/70">
            {contact ? (
              <>Enter the 6-digit code sent to <strong>{contact}</strong></>
            ) : (
              <>Enter the 6-digit verification code from your email</>
            )}
          </p>
        </div>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Verification Code</CardTitle>
            <CardDescription>
              Enter the code we sent to your {contact?.includes('@') ? 'email' : 'phone'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="000000"
                          maxLength={6}
                          className="text-center text-2xl tracking-widest"
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Account"
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-foreground/60 mb-2">
                      Didn&apos;t receive the code?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResendOTP}
                      className="btn-secondary"
                    >
                      Resend Code
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-foreground/60">
            Wrong contact method?{" "}
            <button
              onClick={() => router.push('/signup/patient')}
              className="text-primary hover:underline font-medium"
            >
              Go back to signup
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background py-16 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <VerifyPageContent />
    </Suspense>
  );
}

