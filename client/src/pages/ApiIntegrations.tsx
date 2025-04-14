import React from 'react';
import { XanoIntegrationForm } from '@/components/integrations/XanoIntegrationForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApiIntegrations() {
  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">API Integrations</h1>
        <p className="text-muted-foreground">
          Connect FibonroseTrust with external services to enable advanced identity verification capabilities.
        </p>
        
        <Tabs defaultValue="xano" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="xano">Xano Integration</TabsTrigger>
            <TabsTrigger value="notion">Notion Integration</TabsTrigger>
            <TabsTrigger value="other">Other Services</TabsTrigger>
          </TabsList>
          
          <TabsContent value="xano">
            <XanoIntegrationForm />
          </TabsContent>
          
          <TabsContent value="notion">
            <Card>
              <CardHeader>
                <CardTitle>Notion Integration</CardTitle>
                <CardDescription>
                  Connect to Notion to sync identity verification data and workflow management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Notion integration is coming soon. This feature will allow you to:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-1 text-muted-foreground">
                  <li>Sync verification data to Notion databases</li>
                  <li>Automate verification workflow in Notion</li>
                  <li>Create verification templates in Notion</li>
                  <li>Get notifications for verification status changes</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="other">
            <Card>
              <CardHeader>
                <CardTitle>Additional Services</CardTitle>
                <CardDescription>
                  More integration options will be available soon.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We're working on adding support for these services:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-1 text-muted-foreground">
                  <li>Civic for KYC verification</li>
                  <li>Worldcoin for proof of personhood</li>
                  <li>Chainlink for oracle services</li>
                  <li>IPFS for decentralized data storage</li>
                  <li>Arweave for permanent data storage</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}