import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  RefreshCw, 
  Plus, 
  ExternalLink, 
  Check, 
  X, 
  Clock,
  Trash2,
  Copy,
  Send
} from 'lucide-react';

// Define the types for our data
type WebhookSubscription = {
  id: number;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: string;
  partnerId: number | null;
};

type WebhookDelivery = {
  id: number;
  subscriptionId: number;
  eventType: string;
  status: string;
  createdAt: string;
  payload: any;
  statusCode: number | null;
  response: string | null;
  errorMessage: string | null;
};

// Main component
export default function Webhooks() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Query for fetching webhook subscriptions
  const { 
    data: subscriptions, 
    isLoading: isLoadingSubscriptions, 
    error: subscriptionsError 
  } = useQuery({
    queryKey: ['/api/webhook/subscriptions'],
    queryFn: async () => {
      const response = await fetch('/api/webhook/subscriptions');
      if (!response.ok) {
        throw new Error('Failed to fetch webhook subscriptions');
      }
      return await response.json();
    }
  });

  // Query for fetching webhook deliveries
  const { 
    data: deliveries, 
    isLoading: isLoadingDeliveries, 
    error: deliveriesError 
  } = useQuery({
    queryKey: ['/api/webhook/deliveries'],
    queryFn: async () => {
      const response = await fetch('/api/webhook/deliveries');
      if (!response.ok) {
        throw new Error('Failed to fetch webhook deliveries');
      }
      return await response.json();
    }
  });

  // Mutation for creating webhook subscription
  const addWebhookMutation = useMutation({
    mutationFn: async (newWebhook: any) => {
      const response = await fetch('/api/webhook/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWebhook),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create webhook subscription');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhook/subscriptions'] });
      setIsAddDialogOpen(false);
      toast({
        title: 'Webhook Added',
        description: 'New webhook subscription created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Import webhooks mutation
  const importWebhooksMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/webhook/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to import webhooks');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhook/subscriptions'] });
      setImportDialogOpen(false);
      setFile(null);
      toast({
        title: 'Webhooks Imported',
        description: `Successfully imported ${data.count} webhooks.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Import Error',
        description: `Failed to import webhooks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Export webhooks function
  const exportWebhooks = async () => {
    try {
      const response = await fetch('/api/webhook/export');
      if (!response.ok) {
        throw new Error('Failed to export webhooks');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `webhook-subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      toast({
        title: 'Export Complete',
        description: 'Webhook subscriptions exported to CSV file.',
      });
    } catch (error) {
      toast({
        title: 'Export Error',
        description: `Failed to export webhooks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  // Toggle webhook active status
  const toggleWebhookStatus = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/webhook/subscriptions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update webhook status');
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/webhook/subscriptions'] });
      toast({
        title: 'Webhook Updated',
        description: `Webhook ${isActive ? 'disabled' : 'enabled'} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Update Error',
        description: `Failed to update webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  // Delete webhook
  const deleteWebhook = async (id: number) => {
    try {
      const response = await fetch(`/api/webhook/subscriptions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete webhook');
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/webhook/subscriptions'] });
      toast({
        title: 'Webhook Deleted',
        description: 'Webhook subscription deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Delete Error',
        description: `Failed to delete webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  // Test webhook
  const testWebhook = async (id: number) => {
    try {
      const response = await fetch(`/api/webhook/subscriptions/${id}/test`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to test webhook');
      }
      
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/webhook/deliveries'] });
      toast({
        title: 'Test Sent',
        description: `Test event sent to webhook. Delivery ID: ${result.deliveryId}`,
      });
    } catch (error) {
      toast({
        title: 'Test Error',
        description: `Failed to test webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  // Handle add webhook form submit
  const handleAddWebhook = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    const events = (formData.get('events') as string).split(',').map(e => e.trim());
    const secret = formData.get('secret') as string;
    
    addWebhookMutation.mutate({
      name,
      url,
      events,
      secret,
      isActive: true,
    });
  };

  // Handle import file change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  // Handle import form submit
  const handleImport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    importWebhooksMutation.mutate(formData);
  };

  // Function to view delivery details
  const viewDeliveryDetails = (delivery: WebhookDelivery) => {
    setSelectedDelivery(delivery);
    setIsDeliveryDialogOpen(true);
  };

  // Function to copy payload to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard',
    });
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string, icon: React.ReactNode }> = {
      'DELIVERED': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: <Check className="h-3 w-3 mr-1" /> },
      'FAILED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: <X className="h-3 w-3 mr-1" /> },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: <Clock className="h-3 w-3 mr-1" /> },
      'RECEIVED': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: <RefreshCw className="h-3 w-3 mr-1" /> },
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: null };
    
    return (
      <Badge className={`${config.color} flex items-center`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  // Loading state
  if (isLoadingSubscriptions || isLoadingDeliveries) {
    return <div className="container py-8 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <RefreshCw className="animate-spin h-8 w-8 mb-4" />
        <p>Loading webhook data...</p>
      </div>
    </div>;
  }

  // Error state
  if (subscriptionsError || deliveriesError) {
    return <div className="container py-8">
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There was a problem loading webhook data. Please try again later.</p>
          <p className="text-sm text-gray-500 mt-2">
            {subscriptionsError instanceof Error ? subscriptionsError.message : ''}
            {deliveriesError instanceof Error ? deliveriesError.message : ''}
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/webhook'] })}>
            Retry
          </Button>
        </CardFooter>
      </Card>
    </div>;
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Universal Webhook Hub</h1>
            <p className="text-muted-foreground">
              Manage webhook subscriptions and monitor webhook deliveries.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="flex gap-1">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={exportWebhooks} variant="outline" className="flex gap-1">
              <RefreshCw className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex gap-1">
              <Plus className="h-4 w-4" />
              Add Webhook
            </Button>
          </div>
        </div>

        <Tabs defaultValue="subscriptions" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="deliveries">Delivery History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Subscriptions</CardTitle>
                <CardDescription>
                  List of all registered webhook endpoints that receive events from FibonroseTrust.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptions && subscriptions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Events</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((webhook: WebhookSubscription) => (
                        <TableRow key={webhook.id}>
                          <TableCell className="font-medium">{webhook.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            <a 
                              href={webhook.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:underline"
                            >
                              {webhook.url}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {webhook.events.map((event, i) => (
                                <Badge key={i} variant="outline">{event}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={webhook.isActive}
                              onCheckedChange={() => toggleWebhookStatus(webhook.id, webhook.isActive)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => testWebhook(webhook.id)}
                                title="Test webhook"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteWebhook(webhook.id)}
                                title="Delete webhook"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No webhook subscriptions found.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(true)}
                      className="mt-4"
                    >
                      Add your first webhook
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="deliveries">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Deliveries</CardTitle>
                <CardDescription>
                  History of webhook event deliveries and their status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deliveries && deliveries.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveries.map((delivery: WebhookDelivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell className="font-medium">{delivery.id}</TableCell>
                          <TableCell>{delivery.eventType}</TableCell>
                          <TableCell>
                            {renderStatusBadge(delivery.status)}
                          </TableCell>
                          <TableCell>{new Date(delivery.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewDeliveryDetails(delivery)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No webhook deliveries found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Webhook Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Webhook</DialogTitle>
            <DialogDescription>
              Create a new webhook endpoint to receive events from FibonroseTrust.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddWebhook}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Service Webhook"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  name="url"
                  placeholder="https://example.com/webhooks"
                  type="url"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="events">Events (comma separated)</Label>
                <Input
                  id="events"
                  name="events"
                  placeholder="verification.created, verification.updated"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secret">Secret (for signature verification)</Label>
                <Input
                  id="secret"
                  name="secret"
                  placeholder="webhook_secret"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addWebhookMutation.isPending}>
                {addWebhookMutation.isPending ? 'Creating...' : 'Create Webhook'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Webhooks</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import webhook subscriptions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImport}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  File should have columns: name, url, events, isActive, secret
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!file || importWebhooksMutation.isPending}
              >
                {importWebhooksMutation.isPending ? 'Importing...' : 'Import'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delivery Details Dialog */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Webhook Delivery Details</DialogTitle>
            <DialogDescription>
              {selectedDelivery && `Delivery ID: ${selectedDelivery.id} | Event: ${selectedDelivery.eventType}`}
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label>Status</Label>
                  {renderStatusBadge(selectedDelivery.status)}
                </div>
                {selectedDelivery.errorMessage && (
                  <div className="bg-red-50 p-3 rounded-md border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                    <p className="text-red-700 dark:text-red-300">{selectedDelivery.errorMessage}</p>
                  </div>
                )}
              </div>
              
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <Label>Payload</Label>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(JSON.stringify(selectedDelivery.payload, null, 2))}
                    className="flex gap-1 h-5 text-xs"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <div className="bg-slate-950 p-3 rounded-md overflow-auto max-h-48">
                  <pre className="text-slate-50 text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedDelivery.payload, null, 2)}
                  </pre>
                </div>
              </div>
              
              {selectedDelivery.response && (
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label>Response</Label>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(selectedDelivery.response || '')}
                      className="flex gap-1 h-5 text-xs"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-md overflow-auto max-h-48">
                    <pre className="text-slate-50 text-sm whitespace-pre-wrap">
                      {selectedDelivery.response}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Created At</Label>
                  <p>{new Date(selectedDelivery.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Status Code</Label>
                  <p>{selectedDelivery.statusCode || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDeliveryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}