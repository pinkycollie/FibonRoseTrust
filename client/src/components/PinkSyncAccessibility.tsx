import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, Volume2, VolumeX, Smartphone, Monitor, 
  Palette, Type, MousePointer, Vibrate, Languages
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { VisualFeedback, useVisualFeedback } from "@/components/VisualFeedback";

interface AccessibilityPreferences {
  high_contrast: boolean;
  large_text: boolean;
  animation_reduction: boolean;
  vibration_feedback: boolean;
  sign_language: 'asl' | 'bsl' | 'isl';
}

interface DeviceInterface {
  platform: 'web' | 'ios' | 'android' | 'desktop';
  accessibility_features: string[];
  ui_components: any;
  interaction_modes: string[];
}

export function PinkSyncAccessibility({ userId }: { userId: number }) {
  const { toast } = useToast();
  const { feedback, showSuccess, showError, showWarning } = useVisualFeedback();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    high_contrast: false,
    large_text: false,
    animation_reduction: false,
    vibration_feedback: true,
    sign_language: 'asl'
  });

  // Detect platform
  const platform = (() => {
    if (typeof window === 'undefined') return 'web';
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    if (/electron/.test(userAgent)) return 'desktop';
    return 'web';
  })();

  // Get device interface configuration
  const { data: interfaceConfig } = useQuery<DeviceInterface>({
    queryKey: ['/api/pinksync/interface', platform],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/pinksync/interface/${platform}`);
      const data = await res.json();
      return data.data;
    }
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<AccessibilityPreferences>) => {
      const res = await apiRequest('PATCH', `/api/pinksync/users/${userId}/preferences`, newPreferences);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        setPreferences(data.data.preferences);
        showSuccess('Accessibility preferences updated');
      }
    },
    onError: () => {
      showError('Failed to update preferences');
    }
  });

  const updatePreference = (key: keyof AccessibilityPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    updatePreferencesMutation.mutate({ [key]: value });
  };

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (preferences.high_contrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (preferences.large_text) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (preferences.animation_reduction) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [preferences]);

  const getSignLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'asl': return 'American Sign Language';
      case 'bsl': return 'British Sign Language';
      case 'isl': return 'International Sign Language';
      default: return lang.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      {feedback && <VisualFeedback {...feedback} />}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            PinkSync Accessibility Settings
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-blue-600">
              Platform: {platform}
            </Badge>
            <Badge variant="outline" className="text-purple-600">
              🤟🏽 Deaf Optimized
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="visual" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="interaction">Interaction</TabsTrigger>
              <TabsTrigger value="language">Language</TabsTrigger>
              <TabsTrigger value="device">Device</TabsTrigger>
            </TabsList>

            {/* Visual Preferences */}
            <TabsContent value="visual" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette className="h-4 w-4" />
                    <div>
                      <Label htmlFor="high-contrast">High Contrast Mode</Label>
                      <p className="text-sm text-gray-500">Enhanced contrast for better visibility</p>
                    </div>
                  </div>
                  <Switch
                    id="high-contrast"
                    checked={preferences.high_contrast}
                    onCheckedChange={(checked) => updatePreference('high_contrast', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Type className="h-4 w-4" />
                    <div>
                      <Label htmlFor="large-text">Large Text</Label>
                      <p className="text-sm text-gray-500">Increase text size for easier reading</p>
                    </div>
                  </div>
                  <Switch
                    id="large-text"
                    checked={preferences.large_text}
                    onCheckedChange={(checked) => updatePreference('large_text', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MousePointer className="h-4 w-4" />
                    <div>
                      <Label htmlFor="reduce-motion">Reduce Motion</Label>
                      <p className="text-sm text-gray-500">Minimize animations and transitions</p>
                    </div>
                  </div>
                  <Switch
                    id="reduce-motion"
                    checked={preferences.animation_reduction}
                    onCheckedChange={(checked) => updatePreference('animation_reduction', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Interaction Preferences */}
            <TabsContent value="interaction" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Vibrate className="h-4 w-4" />
                    <div>
                      <Label htmlFor="vibration">Vibration Feedback</Label>
                      <p className="text-sm text-gray-500">Haptic feedback for notifications and interactions</p>
                    </div>
                  </div>
                  <Switch
                    id="vibration"
                    checked={preferences.vibration_feedback}
                    onCheckedChange={(checked) => updatePreference('vibration_feedback', checked)}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <VolumeX className="h-4 w-4" />
                    Audio Alternative
                  </h4>
                  <p className="text-sm text-gray-600">
                    All audio cues are replaced with visual feedback including icons, colors, and vibrations.
                    No audio verification required.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Language Preferences */}
            <TabsContent value="language" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Languages className="h-4 w-4" />
                    Preferred Sign Language
                  </Label>
                  <div className="grid gap-2">
                    {(['asl', 'bsl', 'isl'] as const).map((lang) => (
                      <Button
                        key={lang}
                        variant={preferences.sign_language === lang ? 'default' : 'outline'}
                        className="justify-start"
                        onClick={() => updatePreference('sign_language', lang)}
                      >
                        🤟🏽 {getSignLanguageLabel(lang)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium mb-2">Sign Language Integration</h4>
                  <p className="text-sm text-gray-600">
                    Your preferred sign language will be used for video content recommendations, 
                    interpreter matching, and community connections.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Device Capabilities */}
            <TabsContent value="device" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Monitor className="h-5 w-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Current Platform</h4>
                    <p className="text-sm text-gray-500 capitalize">{platform}</p>
                  </div>
                </div>

                {interfaceConfig && (
                  <>
                    <div>
                      <h4 className="font-medium mb-2">Available Accessibility Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {interfaceConfig.accessibility_features.map((feature, index) => (
                          <Badge key={index} variant="outline">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Interaction Modes</h4>
                      <div className="flex flex-wrap gap-2">
                        {interfaceConfig.interaction_modes.map((mode, index) => (
                          <Badge key={index} variant="secondary">
                            {mode}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Device Optimization
                  </h4>
                  <p className="text-sm text-gray-600">
                    Your device is optimized for deaf users with visual feedback, 
                    touch-friendly interfaces, and no audio dependencies.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Quick Setup</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updatePreferencesMutation.mutate({
                    high_contrast: true,
                    large_text: true,
                    animation_reduction: true,
                    vibration_feedback: true
                  });
                  showSuccess('Optimized for maximum accessibility');
                }}
              >
                Max Accessibility
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updatePreferencesMutation.mutate({
                    high_contrast: false,
                    large_text: false,
                    animation_reduction: false,
                    vibration_feedback: true
                  });
                  showSuccess('Reset to default settings');
                }}
              >
                Reset Defaults
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}