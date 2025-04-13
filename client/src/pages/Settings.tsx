import { useState } from 'react';
import { Card, CardContent, CardHeader, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved."
      });
    }, 1000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully."
      });
    }, 1000);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
        
        <div className="mt-6">
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <form onSubmit={handleSaveProfile}>
                  <CardHeader>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Information</h2>
                    <CardDescription>
                      Update your personal information and profile picture.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                      <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4 sm:mb-0">
                        <span className="material-icons text-4xl text-gray-400 dark:text-gray-500">account_circle</span>
                      </div>
                      <Button variant="outline" type="button">
                        Change Avatar
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-1">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input id="full-name" defaultValue="Jane Cooper" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" defaultValue="jane.cooper" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" defaultValue="jane@example.com" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" placeholder="Enter your phone number (optional)" />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <form onSubmit={handleSavePassword}>
                    <CardHeader>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Change Password</h2>
                      <CardDescription>
                        Update your password to maintain account security.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="border-t border-gray-200 dark:border-gray-700 space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>

                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</h2>
                    <CardDescription>
                      Add an extra layer of security to your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Enable Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Require a verification code when logging in</p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notification Preferences</h2>
                  <CardDescription>
                    Manage how you receive notifications and alerts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Verification Updates</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications about your verification status</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Trust Score Changes</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when your trust score changes</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Security Alerts</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Be alerted about security-related events</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">System Updates</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive information about system changes and new features</p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Marketing Communications</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get updates about new services and offers</p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="advanced">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">API Access</h2>
                    <CardDescription>
                      Manage your API keys and access to the FibonRoseID API.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="api-key">API Key</Label>
                        <div className="flex mt-1">
                          <Input 
                            id="api-key" 
                            type="text" 
                            value="fb_api_9a8b7c6d5e4f3g2h1i0j" 
                            readOnly 
                            className="flex-1"
                          />
                          <Button variant="outline" className="ml-2">Copy</Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="api-secret">API Secret</Label>
                        <div className="flex mt-1">
                          <Input 
                            id="api-secret" 
                            type="password" 
                            value="secret_fb_9a8b7c6d5e4f3g2h1i0j" 
                            readOnly 
                            className="flex-1"
                          />
                          <Button variant="outline" className="ml-2">Reveal</Button>
                        </div>
                      </div>
                      
                      <Button variant="outline">Regenerate API Keys</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Account Actions</h2>
                    <CardDescription>
                      Manage your account data and settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Export All Data</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Download all your personal data and verification history.
                        </p>
                        <Button variant="outline">Export Data</Button>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
                        
                        <Alert className="mt-2 border-red-300 dark:border-red-800">
                          <AlertDescription>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium">Delete Account</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Permanently delete your account and all associated data.
                                </p>
                              </div>
                              <Button variant="destructive" className="mt-2 sm:mt-0">Delete Account</Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
