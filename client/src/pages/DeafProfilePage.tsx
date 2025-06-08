import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Phone, PhoneOff, Users, Briefcase, Shield, Star, 
  MessageSquare, Video, Heart, Award, Building, 
  AlertTriangle, Camera, FileText, CheckCircle
} from "lucide-react";
import { TikTokShareButton } from "@/components/TikTokShareButton";
import { PinkSyncAccessibility } from "@/components/PinkSyncAccessibility";
import { useQuery } from "@tanstack/react-query";

interface DeafProfile {
  userId: number;
  username: string;
  name: string;
  isDeaf: boolean;
  aslFluency: 'beginner' | 'intermediate' | 'advanced' | 'native';
  preferredCommunication: string[];
  trustScore: number;
  verificationLevel: number;
  communityVouches: number;
  companyEndorsements: number;
  badges: string[];
  emergencyContactMethod: 'text' | 'email' | 'video' | 'app';
  accessibilityFeatures: string[];
  profileCompleteness: number;
}

export default function DeafProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Mock data - replace with actual API call
  const deafProfile: DeafProfile = {
    userId: 1,
    username: 'jane.cooper',
    name: 'Jane Cooper',
    isDeaf: true,
    aslFluency: 'native',
    preferredCommunication: ['ASL', 'Text', 'Video Relay'],
    trustScore: 8,
    verificationLevel: 5,
    communityVouches: 12,
    companyEndorsements: 3,
    badges: ['ASL_FLUENT', 'DEAF_COMMUNITY_LEADER', 'ACCESSIBILITY_ADVOCATE', 'EMERGENCY_VERIFIED'],
    emergencyContactMethod: 'text',
    accessibilityFeatures: ['Visual Alerts', 'Text-to-Speech', 'Video Relay', 'Live Captions'],
    profileCompleteness: 95
  };

  const getASLBadgeColor = (fluency: string) => {
    switch (fluency) {
      case 'native': return 'bg-purple-500 text-white';
      case 'advanced': return 'bg-blue-500 text-white';
      case 'intermediate': return 'bg-green-500 text-white';
      case 'beginner': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'ASL_FLUENT': return '🤟🏽';
      case 'DEAF_COMMUNITY_LEADER': return '👥';
      case 'ACCESSIBILITY_ADVOCATE': return '♿';
      case 'EMERGENCY_VERIFIED': return '🚨';
      default: return '✓';
    }
  };

  const getBadgeLabel = (badge: string) => {
    switch (badge) {
      case 'ASL_FLUENT': return 'ASL Fluent';
      case 'DEAF_COMMUNITY_LEADER': return 'Community Leader';
      case 'ACCESSIBILITY_ADVOCATE': return 'Accessibility Advocate';
      case 'EMERGENCY_VERIFIED': return 'Emergency Verified';
      default: return badge.replace('_', ' ');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/api/placeholder/80/80" />
            <AvatarFallback className="text-2xl bg-purple-100">
              {deafProfile.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{deafProfile.name}</h1>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                🤟🏽 Deaf Verified
              </Badge>
            </div>
            <p className="text-gray-600">@{deafProfile.username}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold">{deafProfile.trustScore}/21</span>
                <span className="text-sm text-gray-500">Trust Score</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="font-semibold">Level {deafProfile.verificationLevel}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="font-semibold">{deafProfile.communityVouches}</span>
                <span className="text-sm text-gray-500">Community Vouches</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Completeness */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completeness</span>
              <span className="text-sm text-gray-500">{deafProfile.profileCompleteness}%</span>
            </div>
            <Progress value={deafProfile.profileCompleteness} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="accessibility">PinkSync</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* ASL Fluency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🤟🏽 ASL Fluency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`${getASLBadgeColor(deafProfile.aslFluency)} text-lg px-4 py-2`}>
                  {deafProfile.aslFluency.charAt(0).toUpperCase() + deafProfile.aslFluency.slice(1)}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Verified ASL fluency level through community assessment
                </p>
              </CardContent>
            </Card>

            {/* Communication Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Communication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deafProfile.preferredCommunication.map((method, index) => (
                    <Badge key={index} variant="outline" className="mr-2">
                      {method}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 p-2 bg-red-50 rounded-lg">
                  <PhoneOff className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">No phone calls - Visual verification only</span>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Accessibility Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {deafProfile.accessibilityFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* TikTok Sharing */}
            <div className="md:col-span-1">
              <TikTokShareButton
                userId={deafProfile.userId}
                trustScore={deafProfile.trustScore}
                verificationLevel={deafProfile.verificationLevel}
                isDeaf={deafProfile.isDeaf}
                hasASLBadge={deafProfile.badges.includes('ASL_FLUENT')}
              />
            </div>
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deafProfile.badges.map((badge, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{getBadgeIcon(badge)}</div>
                  <h3 className="font-semibold text-lg mb-2">{getBadgeLabel(badge)}</h3>
                  <p className="text-sm text-gray-600">
                    {badge === 'ASL_FLUENT' && 'Verified ASL fluency through community assessment'}
                    {badge === 'DEAF_COMMUNITY_LEADER' && 'Recognized leader in the deaf community'}
                    {badge === 'ACCESSIBILITY_ADVOCATE' && 'Advocates for accessibility rights and features'}
                    {badge === 'EMERGENCY_VERIFIED' && 'Emergency services can reach via text/visual methods'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Vouching
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4">Recent Vouches ({deafProfile.communityVouches})</h4>
                    <div className="space-y-3">
                      {[
                        { name: 'Alex Rivera', badge: 'ASL Interpreter', message: 'Excellent ASL skills, very patient with beginners' },
                        { name: 'Sam Chen', badge: 'Deaf Advocate', message: 'Great community leader, always helpful' },
                        { name: 'Maria Santos', badge: 'Accessibility Expert', message: 'Passionate about accessibility, knowledgeable' }
                      ].map((vouch, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{vouch.name}</span>
                            <Badge variant="secondary" className="text-xs">{vouch.badge}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{vouch.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Vouch for Others</h4>
                    <Button className="w-full mb-4">
                      <Heart className="h-4 w-4 mr-2" />
                      Vouch for Community Member
                    </Button>
                    <p className="text-sm text-gray-600">
                      Help build trust in the deaf community by vouching for other members you know personally.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Company Hiring & Endorsements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4">Available for Hiring</h4>
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">Customer Service Representative</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Specialized in serving deaf customers through chat, email, and video relay services
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="outline">ASL Fluent</Badge>
                          <Badge variant="outline">Video Relay</Badge>
                          <Badge variant="outline">Text Support</Badge>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Video className="h-4 w-4" />
                          <span className="font-medium">ASL Interpreter Services</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Professional interpretation for business meetings and customer interactions
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="outline">Certified Interpreter</Badge>
                          <Badge variant="outline">Business ASL</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Company Endorsements ({deafProfile.companyEndorsements})</h4>
                    <div className="space-y-3">
                      {[
                        { company: 'TechCorp Solutions', role: 'Customer Support Specialist', rating: 5 },
                        { company: 'AccessFirst Inc', role: 'Accessibility Consultant', rating: 5 },
                        { company: 'CommunityBank', role: 'Deaf Services Coordinator', rating: 4 }
                      ].map((endorsement, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{endorsement.company}</span>
                            <div className="flex gap-1">
                              {[...Array(endorsement.rating)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{endorsement.role}</p>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      <Award className="h-4 w-4 mr-2" />
                      View All Endorsements
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Emergency Access & Communication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4">Emergency Contact Methods</h4>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg bg-green-50">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Text/SMS</span>
                          <Badge variant="outline" className="text-green-600 border-green-600">Primary</Badge>
                        </div>
                        <p className="text-sm text-gray-600">911 text services enabled in your area</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Video className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Video Relay Service</span>
                        </div>
                        <p className="text-sm text-gray-600">Professional interpreter available 24/7</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Camera className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">Visual Emergency App</span>
                        </div>
                        <p className="text-sm text-gray-600">Location sharing with visual communication</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Police & First Responders</h4>
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Deaf Individual Alert</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          First responders will be automatically notified of your deaf status and preferred communication methods
                        </p>
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          Emergency Verified
                        </Badge>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Medical Information Card</span>
                        </div>
                        <p className="text-sm text-gray-600">Digital card with communication preferences and emergency contacts</p>
                      </div>
                      <Button className="w-full" variant="outline">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Test Emergency Contact
                      </Button>
                    </div>
                  </div>
                </div>

                {/* No Phone Verification Notice */}
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PhoneOff className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-800">Phone Verification Alternative</span>
                  </div>
                  <p className="text-sm text-red-700">
                    This profile uses visual verification methods only. No phone calls or audio verification codes required. 
                    All identity verification is done through video, document upload, and community vouching.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PinkSync Accessibility Tab */}
        <TabsContent value="accessibility">
          <PinkSyncAccessibility userId={deafProfile.userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}