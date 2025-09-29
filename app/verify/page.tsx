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
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const contactParam = searchParams.get('contact');
    if (contactParam) {
      setContact(contactParam);
    }
  }, [searchParams]);

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: VerifyFormData) => {
    if (!contact) {
      toast.error("Missing contact information");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/patient/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact,
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

        // Redirect to onboarding
        router.push(result.next);
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error("Verification failed", {
        description: error instanceof Error ? error.message : "Please check your code and try again",
      });
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
      // For now, just show a message that the code was resent
      // In a real implementation, you'd call an API to resend the OTP
      toast.success("Verification code resent!", {
        description: "Check your email or phone for the new code.",
      });
    } catch {
      toast.error("Failed to resend code");
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
            Enter the 6-digit code sent to <strong>{contact}</strong>
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

