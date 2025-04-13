import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialogAction, AlertDialogCancel, AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Plus, RefreshCw, Trash2, Edit, PlayCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Form validation schemas
const webhookFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  secret: z.string().min(8, 'Secret must be at least 8 characters'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  isActive: z.boolean().default(true),
  partnerId: z.number().optional(),
  headers: z.record(z.string()).optional()
});

type WebhookFormValues = z.infer<typeof webhookFormSchema>;

const testWebhookSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  payload: z.record(z.any()).optional()
});

type TestWebhookFormValues = z.infer<typeof testWebhookSchema>;

export default function WebhooksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('subscriptions');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [filterEvent, setFilterEvent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Fetch webhook subscriptions
  const {
    data: webhooks = [],
    isLoading: isLoadingWebhooks,
    refetch: refetchWebhooks
  } = useQuery({
    queryKey: ['/api/webhooks'],
    retry: 1
  });
  
  // Fetch webhook deliveries
  const {
    data: deliveries = [],
    isLoading: isLoadingDeliveries,
    refetch: refetchDeliveries
  } = useQuery({
    queryKey: ['/api/webhook-deliveries'],
    retry: 1
  });
  
  // Create webhook form
  const createWebhookForm = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      name: '',
      url: '',
      secret: generateRandomSecret(),
      events: [],
      isActive: true,
      headers: {}
    }
  });
  
  // Edit webhook form
  const editWebhookForm = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      name: '',
      url: '',
      secret: '',
      events: [],
      isActive: true,
      headers: {}
    }
  });
  
  // Test webhook form
  const testWebhookForm = useForm<TestWebhookFormValues>({
    resolver: zodResolver(testWebhookSchema),
    defaultValues: {
      eventType: '',
      payload: {
        test: true,
        timestamp: new Date().toISOString()
      }
    }
  });
  
  // Create webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: (data: WebhookFormValues) => 
      apiRequest('/api/webhook', {
        method: 'POST',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
      setIsCreateDialogOpen(false);
      createWebhookForm.reset();
      toast({
        title: 'Webhook created',
        description: 'The webhook subscription has been created successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create webhook',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Update webhook mutation
  const updateWebhookMutation = useMutation({
    mutationFn: (data: WebhookFormValues & { id: number }) => 
      apiRequest(`/api/webhook/${data.id}`, {
        method: 'PATCH',
        data: {
          name: data.name,
          url: data.url,
          secret: data.secret,
          events: data.events,
          isActive: data.isActive,
          partnerId: data.partnerId,
          headers: data.headers
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
      setIsEditDialogOpen(false);
      setSelectedSubscription(null);
      toast({
        title: 'Webhook updated',
        description: 'The webhook subscription has been updated successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update webhook',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/webhook/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
      setIsDeleteDialogOpen(false);
      setSelectedSubscription(null);
      toast({
        title: 'Webhook deleted',
        description: 'The webhook subscription has been deleted successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete webhook',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: (data: { id: number, eventType: string, payload: any }) => 
      apiRequest(`/api/test-webhook/${data.id}`, {
        method: 'POST',
        data: {
          eventType: data.eventType,
          payload: data.payload
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhook-deliveries'] });
      setIsTestDialogOpen(false);
      toast({
        title: 'Webhook test sent',
        description: 'The test webhook has been sent successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to test webhook',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Upload CSV mutation
  const uploadCsvMutation = useMutation({
    mutationFn: (formData: FormData) => 
      apiRequest('/api/import/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        data: formData
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
      toast({
        title: 'Webhooks imported',
        description: `Successfully imported ${data.count} webhook subscriptions`
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to import webhooks',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Handle edit webhook
  const handleEditWebhook = (webhook: any) => {
    setSelectedSubscription(webhook);
    editWebhookForm.reset({
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret,
      events: webhook.events,
      isActive: webhook.isActive,
      partnerId: webhook.partnerId,
      headers: webhook.headers || {}
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle test webhook
  const handleTestWebhook = (webhook: any) => {
    setSelectedSubscription(webhook);
    testWebhookForm.reset({
      eventType: webhook.events[0] || '',
      payload: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });
    setIsTestDialogOpen(true);
  };
  
  // Handle file upload for CSV import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    uploadCsvMutation.mutate(formData);
    
    // Reset the file input
    e.target.value = '';
  };
  
  // Generate a random webhook secret
  function generateRandomSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'whsec_';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // Filter deliveries based on event type and status
  const filteredDeliveries = deliveries.filter((delivery: any) => {
    return (
      (filterEvent === '' || delivery.eventType.includes(filterEvent)) &&
      (filterStatus === '' || delivery.status === filterStatus)
    );
  });
  
  // Event options for webhook subscriptions
  const eventOptions = [
    { value: 'verification.created', label: 'Verification Created' },
    { value: 'verification.updated', label: 'Verification Updated' },
    { value: 'verification.verified', label: 'Verification Verified' },
    { value: 'verification.rejected', label: 'Verification Rejected' },
    { value: 'trust_score.updated', label: 'Trust Score Updated' },
    { value: 'user.created', label: 'User Created' },
    { value: 'user.updated', label: 'User Updated' },
    { value: 'nft.minted', label: 'NFT Minted' },
    { value: 'nft.transferred', label: 'NFT Transferred' }
  ];
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Webhook Management</h1>
          <p className="text-muted-foreground">
            Manage webhook subscriptions and view delivery history
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/webhooks" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </a>
          <label htmlFor="csv-upload" className="cursor-pointer">
            <Button variant="outline" size="sm" className="inline-flex">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Webhook
          </Button>
        </div>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="subscriptions">Webhook Subscriptions</TabsTrigger>
          <TabsTrigger value="deliveries">Delivery History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Subscriptions</CardTitle>
              <CardDescription>
                Configure destinations where webhook events will be sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingWebhooks ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Loading webhook subscriptions...
                        </TableCell>
                      </TableRow>
                    ) : webhooks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No webhook subscriptions found. Create one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      webhooks.map((webhook: any) => (
                        <TableRow key={webhook.id}>
                          <TableCell className="font-medium">{webhook.name}</TableCell>
                          <TableCell className="font-mono text-xs">{webhook.url}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {webhook.events.map((event: string) => (
                                <Badge key={event} variant="outline">
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                              {webhook.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditWebhook(webhook)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleTestWebhook(webhook)}
                              >
                                <PlayCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedSubscription(webhook);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => refetchWebhooks()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Webhook Delivery History</CardTitle>
                  <CardDescription>
                    View the history of webhook delivery attempts
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div>
                    <Input
                      placeholder="Filter by event type..."
                      value={filterEvent}
                      onChange={(e) => setFilterEvent(e.target.value)}
                      className="w-60"
                    />
                  </div>
                  <div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="h-9 px-3 py-1 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">All statuses</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Processed At</TableHead>
                      <TableHead>Attempts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingDeliveries ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Loading webhook deliveries...
                        </TableCell>
                      </TableRow>
                    ) : filteredDeliveries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No webhook deliveries found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDeliveries.map((delivery: any) => (
                        <TableRow key={delivery.id}>
                          <TableCell className="font-mono text-xs">{delivery.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{delivery.eventType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                delivery.status === 'success'
                                  ? 'default'
                                  : delivery.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {delivery.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(delivery.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs">
                            {delivery.processedAt
                              ? new Date(delivery.processedAt).toLocaleString()
                              : '-'}
                          </TableCell>
                          <TableCell>{delivery.attempts}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => refetchDeliveries()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create Webhook Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Webhook Subscription</DialogTitle>
            <DialogDescription>
              Add a new destination to receive webhook events
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createWebhookForm}>
            <form onSubmit={createWebhookForm.handleSubmit((data) => createWebhookMutation.mutate(data))} className="space-y-4">
              <FormField
                control={createWebhookForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Verification Webhook" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this webhook subscription
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createWebhookForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/webhook" {...field} />
                    </FormControl>
                    <FormDescription>
                      The URL where webhook events will be sent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createWebhookForm.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Used to sign webhook payloads for verification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createWebhookForm.control}
                name="events"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Events</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {eventOptions.map((option) => (
                          <Badge
                            key={option.value}
                            variant={field.value.includes(option.value) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const newEvents = field.value.includes(option.value)
                                ? field.value.filter((v) => v !== option.value)
                                : [...field.value, option.value];
                              field.onChange(newEvents);
                            }}
                          >
                            {option.label}
                          </Badge>
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Select events that should trigger this webhook
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createWebhookForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Webhook Status</FormLabel>
                      <FormDescription>
                        Activate or deactivate this webhook subscription
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createWebhookMutation.isPending}>
                  {createWebhookMutation.isPending ? 'Creating...' : 'Create Webhook'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Webhook Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Webhook Subscription</DialogTitle>
            <DialogDescription>
              Update the webhook configuration
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editWebhookForm}>
            <form
              onSubmit={editWebhookForm.handleSubmit((data) =>
                updateWebhookMutation.mutate({
                  ...data,
                  id: selectedSubscription.id
                })
              )}
              className="space-y-4"
            >
              <FormField
                control={editWebhookForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this webhook subscription
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editWebhookForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The URL where webhook events will be sent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editWebhookForm.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Used to sign webhook payloads for verification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editWebhookForm.control}
                name="events"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Events</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {eventOptions.map((option) => (
                          <Badge
                            key={option.value}
                            variant={field.value.includes(option.value) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const newEvents = field.value.includes(option.value)
                                ? field.value.filter((v) => v !== option.value)
                                : [...field.value, option.value];
                              field.onChange(newEvents);
                            }}
                          >
                            {option.label}
                          </Badge>
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Select events that should trigger this webhook
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editWebhookForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Webhook Status</FormLabel>
                      <FormDescription>
                        Activate or deactivate this webhook subscription
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateWebhookMutation.isPending}>
                  {updateWebhookMutation.isPending ? 'Updating...' : 'Update Webhook'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Test Webhook Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
            <DialogDescription>
              Send a test webhook to {selectedSubscription?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...testWebhookForm}>
            <form
              onSubmit={testWebhookForm.handleSubmit((data) =>
                testWebhookMutation.mutate({
                  id: selectedSubscription.id,
                  eventType: data.eventType,
                  payload: data.payload
                })
              )}
              className="space-y-4"
            >
              <FormField
                control={testWebhookForm.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={field.onChange}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                      >
                        <option value="">Select an event type</option>
                        {selectedSubscription?.events.map((event: string) => (
                          <option key={event} value={event}>
                            {event}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      The type of event to send in the test webhook
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={testWebhookForm.control}
                name="payload"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payload (JSON)</FormLabel>
                    <FormControl>
                      <textarea
                        value={JSON.stringify(field.value, null, 2)}
                        onChange={(e) => {
                          try {
                            field.onChange(JSON.parse(e.target.value));
                          } catch (error) {
                            // Ignore invalid JSON
                          }
                        }}
                        className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-sm"
                      />
                    </FormControl>
                    <FormDescription>
                      The JSON payload to send with the webhook
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={testWebhookMutation.isPending}>
                  {testWebhookMutation.isPending ? 'Sending...' : 'Send Test Webhook'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Webhook Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the webhook "{selectedSubscription?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWebhookMutation.mutate(selectedSubscription.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}