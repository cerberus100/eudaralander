"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Upload, CheckCircle } from "lucide-react";

const clinicianSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  npi: z.string().min(10, "NPI must be 10 digits").max(10, "NPI must be 10 digits").regex(/^\d+$/, "NPI must contain only digits"),
  licenseNumber: z.string().min(1, "License number is required"),
  states: z.array(z.string()).min(1, "At least one state is required"),
  specialties: z.array(z.string()).min(1, "At least one specialty is required"),
  documents: z.object({
    malpracticeKey: z.string().optional(),
    deaKey: z.string().optional(),
    extras: z.array(z.string()).optional(),
  }).optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms & HIPAA Notice"
  }),
});

type ClinicianFormData = z.infer<typeof clinicianSchema>;

const usStates = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const specialties = [
  "Family Medicine",
  "Internal Medicine",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Psychiatry",
  "Emergency Medicine",
  "Surgery",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Hematology/Oncology",
  "Infectious Disease",
  "Nephrology",
  "Neurology",
  "Ophthalmology",
  "Orthopedic Surgery",
  "Otolaryngology",
  "Pulmonology",
  "Radiology",
  "Urology",
  "Other"
];

export default function ClinicianSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const steps = [
    { id: 1, title: "Identity", description: "Personal information" },
    { id: 2, title: "Licenses", description: "State licenses" },
    { id: 3, title: "Documents", description: "Upload credentials" },
    { id: 4, title: "Clinical", description: "Specialties & flags" },
  ];

  const totalSteps = steps.length;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };


  const form = useForm<ClinicianFormData>({
    resolver: zodResolver(clinicianSchema),
    defaultValues: {
      states: [],
      specialties: [],
      consent: false,
    },
  });

  const onSubmit = async (data: ClinicianFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('https://eudaura.com/api/clinician/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          npi: data.npi,
          licenseNumber: data.licenseNumber,
          states: data.states,
          specialties: data.specialties,
          consent: data.consent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit application');
      }

      await response.json();

      toast.success("Application submitted successfully!", {
        description: "We'll review your credentials and email you an invite to activate your account.",
      });

      router.push('/thankyou/clinician');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Failed to submit application", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Apply to Join Eudaura
          </h1>
          <p className="text-foreground/70">
            Join our network of independent healthcare professionals
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      step.id < currentStep ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <h2 className="text-lg font-semibold text-foreground">
              Step {currentStep}: {steps[currentStep - 1]?.title}
            </h2>
            <p className="text-sm text-foreground/70">
              {steps[currentStep - 1]?.description}
            </p>
          </div>
        </div>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Clinician Application</CardTitle>
            <CardDescription>
              Please provide your professional information to apply
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Step 1: Identity */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Dr. Jane Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="doctor@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Licenses */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">State Licenses</h3>
                    <p className="text-sm text-foreground/70">
                      Add all states where you hold active medical licenses
                    </p>

                    <FormField
                      control={form.control}
                      name="states"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>States Licensed to Practice *</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto border border-warm-gray/30 rounded-md p-4">
                              {usStates.map((state) => (
                                <div key={state} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`state-${state}`}
                                    checked={field.value?.includes(state)}
                                    onChange={(e) => {
                                      const currentStates = field.value || [];
                                      if (e.target.checked) {
                                        field.onChange([...currentStates, state]);
                                      } else {
                                        field.onChange(currentStates.filter(s => s !== state));
                                      }
                                    }}
                                    className="rounded border-warm-gray/30 text-primary focus:ring-primary"
                                  />
                                  <label htmlFor={`state-${state}`} className="text-sm">
                                    {state}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Documents */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Document Uploads</h3>
                    <div className="bg-primary/5 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Upload className="w-6 h-6 text-primary mr-3" />
                        <h4 className="font-semibold">Upload Required Documents</h4>
                      </div>
                      <p className="text-sm text-foreground/70 mb-6">
                        Please upload clear photos or PDFs of your credentials. Accepted formats: PDF, PNG, JPG (max 10MB each)
                      </p>

                      <div className="space-y-4">
                        <div className="border border-warm-gray/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">Primary State License *</h5>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('license-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                          <p className="text-sm text-foreground/60">Upload your primary state medical license</p>
                          <input
                            id="license-upload"
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              try {
                                const { url, key } = await fetch('https://eudaura.com/api/uploads/presign', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    filename: file.name,
                                    contentType: file.type,
                                  }),
                                }).then(res => res.json());

                                await fetch(url, {
                                  method: 'PUT',
                                  body: file,
                                });

                                form.setValue('documents.malpracticeKey', key);
                              } catch (error) {
                                console.error('Upload error:', error);
                              }
                            }}
                          />
                        </div>

                        <div className="border border-warm-gray/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">Malpractice Insurance</h5>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('malpractice-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                          <p className="text-sm text-foreground/60">Upload your current malpractice insurance certificate</p>
                          <input
                            id="malpractice-upload"
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              try {
                                const { url, key } = await fetch('https://eudaura.com/api/uploads/presign', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    filename: file.name,
                                    contentType: file.type,
                                  }),
                                }).then(res => res.json());

                                await fetch(url, {
                                  method: 'PUT',
                                  body: file,
                                });

                                form.setValue('documents.malpracticeKey', key);
                              } catch (error) {
                                console.error('Upload error:', error);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Clinical & Billing Flags */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Clinical Information</h3>

                    <FormField
                      control={form.control}
                      name="specialties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialties *</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-warm-gray/30 rounded-md p-4">
                              {specialties.map((specialty) => (
                                <div key={specialty} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`specialty-${specialty}`}
                                    checked={field.value?.includes(specialty)}
                                    onChange={(e) => {
                                      const currentSpecialties = field.value || [];
                                      if (e.target.checked) {
                                        field.onChange([...currentSpecialties, specialty]);
                                      } else {
                                        field.onChange(currentSpecialties.filter(s => s !== specialty));
                                      }
                                    }}
                                    className="rounded border-warm-gray/30 text-primary focus:ring-primary"
                                  />
                                  <label htmlFor={`specialty-${specialty}`} className="text-sm">
                                    {specialty}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Consent */}
                    <FormField
                      control={form.control}
                      name="consent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the{" "}
                              <a href="/terms" className="text-primary hover:underline" target="_blank">
                                Terms of Service
                              </a>{" "}
                              and{" "}
                              <a href="/privacy" className="text-primary hover:underline" target="_blank">
                                HIPAA Notice
                              </a>{" *"}
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t border-warm-gray/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="btn-secondary"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="btn-primary"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Submitting Application...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
