import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { HelpCircle, AlertCircle, CheckCircle } from "lucide-react";

const whySubmissionSchema = z.object({
  verificationType: z.string({
    required_error: "Please select a verification type",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  evidence: z.string().optional(),
});

type WhyFormValues = z.infer<typeof whySubmissionSchema>;

interface WhySubmissionProps {
  userId: number;
}

/**
 * WHY Submission component for submitting identity verification requests
 * through the NegraRosa WHY system
 */
export function WhySubmission({ userId }: WhySubmissionProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const form = useForm<WhyFormValues>({
    resolver: zodResolver(whySubmissionSchema),
    defaultValues: {
      verificationType: "",
      description: "",
      evidence: "",
    },
  });
  
  async function onSubmit(data: WhyFormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/security/why-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          verificationType: data.verificationType,
          description: data.description,
          evidence: data.evidence
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsSubmitted(true);
        toast({
          title: "WHY Submission Complete",
          description: "Your verification request has been submitted successfully.",
          variant: "default",
        });
      } else {
        toast({
          title: "Submission Failed",
          description: result.message || "Failed to submit verification request.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while submitting your request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isSubmitted) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <CardTitle className="text-xl font-bold text-gray-900">
              WHY Submission Complete
            </CardTitle>
          </div>
          <CardDescription>
            Your verification request has been submitted for processing
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="p-6 bg-green-50 rounded-md text-center">
            <p className="text-sm text-gray-700 mb-4">
              Your verification request has been received and is now being processed by our security team.
              You will receive a notification once it has been reviewed.
            </p>
            
            <Button
              variant="outline"
              onClick={() => setIsSubmitted(false)}
            >
              Submit Another Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-indigo-500" />
          <CardTitle className="text-xl font-bold text-gray-900">
            WHY Identity Verification System
          </CardTitle>
        </div>
        <CardDescription>
          Submit a verification request to enhance your security profile
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="p-4 mb-6 bg-blue-50 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">About the WHY system</p>
            <p>
              The WHY verification system is designed to provide an enhanced level of identity verification 
              and security. By submitting additional evidence of your identity, you can increase your 
              trust score and access more features and services.
            </p>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="verificationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type of verification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="identity">Identity (ID/Passport)</SelectItem>
                      <SelectItem value="address">Address Verification</SelectItem>
                      <SelectItem value="professional">Professional Credentials</SelectItem>
                      <SelectItem value="biometric">Biometric Verification</SelectItem>
                      <SelectItem value="financial">Financial Record</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of verification you want to submit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about your verification submission"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe what you're submitting and why this verification should be approved.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="evidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/my-evidence"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    If your evidence is already uploaded elsewhere, provide the URL.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start pt-0">
        <p className="text-xs text-gray-500 mt-2">
          Powered by the NegraRosa Security Framework • FibonRoseTrust
        </p>
      </CardFooter>
    </Card>
  );
}