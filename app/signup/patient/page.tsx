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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  insuranceYesNo: z.enum(["yes", "no"]),
  insuranceType: z.enum(["Medicare", "Medicaid", "Commercial"]).optional(),
  medicareType: z.enum(["A/B", "Advantage"]).optional(),
  medicareId: z.string().optional(),
  advantageCarrier: z.string().optional(),
  advantagePlanName: z.string().optional(),
  medicaidState: z.string().optional(),
  medicaidId: z.string().optional(),
  commercialCarrier: z.string().optional(),
  planName: z.string().optional(),
  memberId: z.string().optional(),
  groupId: z.string().optional(),
  preferredContact: z.enum(["email", "sms"]),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms & HIPAA Notice"
  }),
}).refine((data) => {
  if (data.preferredContact === "sms" && !data.phone) {
    return false;
  }
  return true;
}, {
  message: "Phone is required when SMS is selected as preferred contact",
  path: ["phone"]
}).refine((data) => {
  if (data.insuranceYesNo === "yes") {
    if (!data.insuranceType) return false;
    if (data.insuranceType === "Medicare") {
      return !!data.medicareId && (!data.medicareType || data.medicareType === "A/B" || data.advantageCarrier);
    }
    if (data.insuranceType === "Medicaid") {
      return !!data.medicaidId && !!data.medicaidState;
    }
    if (data.insuranceType === "Commercial") {
      return !!data.commercialCarrier && !!data.memberId;
    }
  }
  return true;
}, {
  message: "Insurance details are required",
  path: ["insuranceType"]
});

type PatientFormData = z.infer<typeof patientSchema>;

const insuranceCarriers = [
  "UnitedHealthcare",
  "Aetna",
  "Cigna",
  "Blue Cross Blue Shield",
  "Humana",
  "Kaiser Permanente",
  "Other"
];

const usStates = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function PatientSignup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      insuranceYesNo: "no",
      preferredContact: "email",
      consent: false,
    },
  });

  const watchInsuranceYesNo = form.watch("insuranceYesNo");
  const watchInsuranceType = form.watch("insuranceType");
  const watchPreferredContact = form.watch("preferredContact");

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('https://eudaura.com/api/patient/provisional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          dob: data.dob,
          email: data.email,
          phone: data.phone || undefined,
          address: {
            address1: data.address1,
            address2: data.address2 || undefined,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
          },
          insurance: data.insuranceYesNo === "yes" ? {
            hasInsurance: true,
            type: data.insuranceType,
            ...(data.insuranceType === "Medicare" && {
              medicare: {
                type: data.medicareType,
                id: data.medicareId,
                ...(data.medicareType === "Advantage" && {
                  advantageCarrier: data.advantageCarrier,
                  advantagePlanName: data.advantagePlanName,
                }),
              },
            }),
            ...(data.insuranceType === "Medicaid" && {
              medicaid: {
                state: data.medicaidState,
                id: data.medicaidId,
              },
            }),
            ...(data.insuranceType === "Commercial" && {
              commercial: {
                carrier: data.commercialCarrier,
                planName: data.planName,
                memberId: data.memberId,
                groupId: data.groupId,
              },
            }),
          } : { hasInsurance: false },
          preferredContact: data.preferredContact,
          consent: data.consent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit form');
      }

      await response.json();

      toast.success("Account created successfully!", {
        description: "We've sent a verification code to your " + (data.preferredContact === "email" ? "email" : "phone"),
      });

      const contact = data.preferredContact === "email" ? data.email : data.phone;
      router.push(`/verify?contact=${encodeURIComponent(contact!)}`);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Failed to create account", {
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
            Create Patient Account
          </h1>
          <p className="text-foreground/70">
            We&apos;ll send a verification code to confirm your account
          </p>
        </div>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>
              Please provide your details to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number {watchPreferredContact === "sms" && "*"}</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="(555) 123-4567"
                            {...field}
                            required={watchPreferredContact === "sms"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Address</h3>
                  <FormField
                    control={form.control}
                    name="address1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1 *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input placeholder="Apt 4B" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {usStates.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Insurance */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Insurance Information</h3>
                  <FormField
                    control={form.control}
                    name="insuranceYesNo"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Do you have insurance? *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="insurance-yes" />
                              <label htmlFor="insurance-yes">Yes</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="insurance-no" />
                              <label htmlFor="insurance-no">No</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchInsuranceYesNo === "yes" && (
                    <FormField
                      control={form.control}
                      name="insuranceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select insurance type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Medicare">Medicare</SelectItem>
                              <SelectItem value="Medicaid">Medicaid</SelectItem>
                              <SelectItem value="Commercial">Commercial</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Medicare Fields */}
                  {watchInsuranceYesNo === "yes" && watchInsuranceType === "Medicare" && (
                    <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                      <FormField
                        control={form.control}
                        name="medicareType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medicare Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Medicare type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="A/B">Part A/B</SelectItem>
                                <SelectItem value="Advantage">Medicare Advantage</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="medicareId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medicare ID *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Medicare ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("medicareType") === "Advantage" && (
                        <>
                          <FormField
                            control={form.control}
                            name="advantageCarrier"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Advantage Carrier *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select carrier" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {insuranceCarriers.map((carrier) => (
                                      <SelectItem key={carrier} value={carrier}>
                                        {carrier}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="advantagePlanName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Plan Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter plan name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* Medicaid Fields */}
                  {watchInsuranceYesNo === "yes" && watchInsuranceType === "Medicaid" && (
                    <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                      <FormField
                        control={form.control}
                        name="medicaidState"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medicaid State *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {usStates.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="medicaidId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medicaid ID *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Medicaid ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Commercial Fields */}
                  {watchInsuranceYesNo === "yes" && watchInsuranceType === "Commercial" && (
                    <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                      <FormField
                        control={form.control}
                        name="commercialCarrier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Insurance Carrier *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select carrier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {insuranceCarriers.map((carrier) => (
                                  <SelectItem key={carrier} value={carrier}>
                                    {carrier}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="planName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plan Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter plan name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="memberId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Member ID *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter member ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="groupId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Group ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter group ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Preferences</h3>
                  <FormField
                    control={form.control}
                    name="preferredContact"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Preferred Contact Method *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="email" id="contact-email" />
                              <label htmlFor="contact-email">Email</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sms" id="contact-sms" />
                              <label htmlFor="contact-sms">SMS</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
