import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// Form validation schema
const xanoIntegrationSchema = z.object({
  apiKey: z.string().min(1, { message: 'API key is required' }),
  baseUrl: z.string().min(1, { message: 'Base URL is required' }).default('https://x8ki-letl-twmt.n7.xano.io'),
  webhookSecret: z.string().optional(),
  aiEnabled: z.boolean().default(false),
  userId: z.number().default(1),
});

type XanoIntegrationFormValues = z.infer<typeof xanoIntegrationSchema>;

type XanoIntegrationFormProps = {
  userId?: number;
  onSuccess?: () => void;
};

export function XanoIntegrationForm({ userId = 1, onSuccess }: XanoIntegrationFormProps) {
  const { toast } = useToast();
  const [testStatus, setTestStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = React.useState<string>('');
  
  const form = useForm<XanoIntegrationFormValues>({
    resolver: zodResolver(xanoIntegrationSchema),
    defaultValues: {
      baseUrl: 'https://x8ki-letl-twmt.n7.xano.io',
      apiKey: '',
      webhookSecret: '',
      aiEnabled: false,
      userId,
    },
  });
  
  async function testConnection(values: XanoIntegrationFormValues) {
    setTestStatus('testing');
    setTestMessage('Testing connection to Xano...');
    
    try {
      // Call a backend endpoint to test the connection
      const response = await fetch('/api/xano/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: values.apiKey, baseUrl: values.baseUrl }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestStatus('success');
        setTestMessage('Connection successful! Your Xano API key is valid.');
      } else {
        setTestStatus('error');
        setTestMessage(data.message || 'Failed to connect to Xano. Please check your API key and try again.');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage('An error occurred while testing the connection. Please try again.');
      console.error('Error testing Xano connection:', error);
    }
  }
  
  async function onSubmit(values: XanoIntegrationFormValues) {
    try {
      const response = await fetch('/api/xano/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (response.ok) {
        toast({
          title: 'Xano Integration Configured',
          description: 'Your Xano integration has been set up successfully.',
        });
        
        // Invalidate any relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'xano-integrations'] });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to configure Xano integration');
      }
    } catch (error) {
      console.error('Error configuring Xano integration:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to configure Xano integration. Please try again.',
        variant: 'destructive',
      });
    }
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configure Xano Integration</CardTitle>
        <CardDescription>
          Connect to your Xano instance at x8ki-letl-twmt.n7.xano.io to enable data synchronization and webhook processing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xano API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your Xano API key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="webhookSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook Secret (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Secret for webhook signature validation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="aiEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable AI Features</FormLabel>
                    <CardDescription>
                      Enable AI-powered data analysis and insights using Xano's AI capabilities.
                    </CardDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {testStatus !== 'idle' && (
              <Alert variant={testStatus === 'success' ? 'default' : testStatus === 'error' ? 'destructive' : 'default'}>
                {testStatus === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : testStatus === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : null}
                <AlertTitle>
                  {testStatus === 'success' ? 'Success' : testStatus === 'error' ? 'Error' : 'Testing'}
                </AlertTitle>
                <AlertDescription>
                  {testMessage}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-row space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => testConnection(form.getValues())}
                disabled={!form.getValues().apiKey || testStatus === 'testing'}
              >
                Test Connection
              </Button>
              <Button type="submit" disabled={testStatus === 'testing'}>
                Save Configuration
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}