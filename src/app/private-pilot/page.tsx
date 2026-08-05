"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  pilotApplicationSchema,
  type PilotApplicationInput,
  PILOT_TIMING_OPTIONS,
} from "@/lib/validation/pilot-application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle2, Loader2, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivatePilotPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<PilotApplicationInput>({
    resolver: zodResolver(pilotApplicationSchema),
    defaultValues: {
      fullName: "",
      businessName: "",
      whopBusinessUrl: "",
      email: "",
      approximatePayingMembers: undefined,
      courses: "",
      typicalMembershipPrice: undefined,
      monthlyNewMembers: undefined,
      currentFollowUpProcess: "",
      primaryRetentionConcern: "",
      preferredPilotTiming: "flexible",
      consentToContact: false as unknown as true,
      honeypot: "",
    },
  });

  async function onSubmit(values: PilotApplicationInput) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/private-pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-2xl">Application Received</CardTitle>
            <CardDescription className="text-base">
              Thank you for your interest in the RescueLoop private pilot program.
              We&apos;ll review your application and reach out within a few business days.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              In the meantime, you&apos;ll receive a confirmation at the email you provided.
            </p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to RescueLoop
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" />
            RescueLoop
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Private Pilot Program</h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Join a select group of creators using RescueLoop to recover slipping members
            and prove which interventions restore progress and revenue.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* About you */}
            <Card>
              <CardHeader>
                <CardTitle>About You</CardTitle>
                <CardDescription>Tell us about yourself and your business.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Courses" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whopBusinessUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Whop business URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://whop.com/your-business" {...field} />
                      </FormControl>
                      <FormDescription>Optional — helps us find your account faster.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Your membership business */}
            <Card>
              <CardHeader>
                <CardTitle>Your Membership Business</CardTitle>
                <CardDescription>Help us understand the scale and nature of your program.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="approximatePayingMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approx. paying members</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthlyNewMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly new members</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="typicalMembershipPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typical membership price (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="29.99"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Courses</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., &quot;Python Mastery&quot;, &quot;Trading 101&quot; — one per line"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>List your main courses or content areas.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Retention context */}
            <Card>
              <CardHeader>
                <CardTitle>Retention Context</CardTitle>
                <CardDescription>
                  Understanding your current process helps us tailor the pilot.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="currentFollowUpProcess"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current student follow-up process</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="How do you currently check in on students who stall or disengage?"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryRetentionConcern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary retention concern</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What&apos;s the biggest challenge you face keeping members engaged?"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredPilotTiming"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred pilot timing <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select timing" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PILOT_TIMING_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Consent */}
            <Card>
              <CardHeader>
                <CardTitle>Consent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="consentToContact"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked === true ? true : false)}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-snug">
                        <FormLabel>
                          I consent to being contacted about the pilot program <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormDescription>
                          We&apos;ll only use your email to discuss the pilot. No spam, ever.
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    Your information is stored securely and used solely for pilot program evaluation.
                    We will not share your data with third parties. See our{" "}
                    <Link href="/legal/privacy" className="underline hover:text-foreground">
                      privacy policy
                    </Link>{" "}
                    for details.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Honeypot — invisible to real users */}
            <div className="sr-only" aria-hidden="true">
              <FormField
                control={form.control}
                name="honeypot"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input tabIndex={-1} autoComplete="off" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit */}
            {submitError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply for Private Pilot
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
