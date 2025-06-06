import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Share2, TrendingUp, Users, Heart, MessageCircle, Phone, PhoneOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ShareContent {
  tiktokCaption: string;
  instagramCaption: string;
  twitterCaption: string;
  hashtagsOptimized: string[];
}

interface TikTokShareButtonProps {
  userId: number;
  trustScore: number;
  verificationLevel: number;
  walletAddress?: string;
  nftTokenId?: string;
  isDeaf?: boolean;
  hasASLBadge?: boolean;
}

export function TikTokShareButton({ 
  userId, 
  trustScore, 
  verificationLevel, 
  walletAddress, 
  nftTokenId,
  isDeaf = false,
  hasASLBadge = false
}: TikTokShareButtonProps) {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<'tiktok' | 'instagram' | 'twitter'>('tiktok');
  const [customCaption, setCustomCaption] = useState('');

  // Fetch optimized share content
  const { data: shareContent, isLoading } = useQuery<ShareContent>({
    queryKey: ['/api/social/share-content', userId],
    enabled: !!userId
  });

  // Sync social media data
  const syncSocialMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/social/sync', { userId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Social data synced",
        description: "Your verification is now optimized for TikTok sharing"
      });
    }
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Share content is ready to paste"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the text manually",
        variant: "destructive"
      });
    }
  };

  const getDeafOptimizedCaption = () => {
    const baseCaption = getCaption();
    if (!isDeaf) return baseCaption;
    
    const deafTags = hasASLBadge ? 
      ' #DeafTalent #ASLFluent #DeafCommunity #AccessibleHiring #DeafPride' :
      ' #DeafCommunity #AccessibilityMatters #DeafPride #InclusiveHiring';
    
    return baseCaption + deafTags;
  };

  const getCaption = () => {
    if (customCaption) return customCaption;
    if (!shareContent) return '';
    
    const deafPrefix = isDeaf ? '🤟 Deaf & Verified! ' : '';
    
    switch (selectedPlatform) {
      case 'tiktok':
        return deafPrefix + shareContent.tiktokCaption;
      case 'instagram':
        return deafPrefix + shareContent.instagramCaption;
      case 'twitter':
        return deafPrefix + shareContent.twitterCaption;
      default:
        return deafPrefix + shareContent.tiktokCaption;
    }
  };

  const getPlatformUrl = () => {
    const caption = encodeURIComponent(getDeafOptimizedCaption());
    
    switch (selectedPlatform) {
      case 'tiktok':
        return `https://www.tiktok.com/upload?caption=${caption}`;
      case 'instagram':
        return `https://www.instagram.com/`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${caption}`;
      default:
        return '#';
    }
  };

  const getTikTokReadyStatus = () => {
    if (isDeaf && hasASLBadge && trustScore >= 3) return 'Deaf Talent Ready';
    if (isDeaf && trustScore >= 3) return 'Deaf Community Ready';
    return trustScore >= 3 ? 'TikTok Ready' : 'Build Trust Score';
  };

  const getEngagementPrediction = () => {
    if (isDeaf && hasASLBadge && trustScore >= 8) return 'High deaf community engagement';
    if (isDeaf && trustScore >= 5) return 'Good accessibility reach';
    if (trustScore >= 8) return 'High engagement expected';
    return 'Build trust for better reach';
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-pink-500" />
          {isDeaf ? 'Deaf Community TikTok Sharing' : 'TikTok-Optimized Sharing'}
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Badge variant={trustScore >= 3 ? "default" : "secondary"}>
            {getTikTokReadyStatus()}
          </Badge>
          <Badge variant="outline">
            Level {verificationLevel}
          </Badge>
          {isDeaf && (
            <Badge variant="outline" className="text-blue-600">
              🤟 Deaf Verified
            </Badge>
          )}
          {hasASLBadge && (
            <Badge variant="outline" className="text-purple-600">
              ASL Fluent
            </Badge>
          )}
          {walletAddress && (
            <Badge variant="outline" className="text-green-600">
              Web3 Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Platform Selection */}
        <div className="flex gap-2">
          <Button
            variant={selectedPlatform === 'tiktok' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlatform('tiktok')}
            className={selectedPlatform === 'tiktok' ? 'bg-black text-white' : ''}
          >
            TikTok
          </Button>
          <Button
            variant={selectedPlatform === 'instagram' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlatform('instagram')}
            className={selectedPlatform === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : ''}
          >
            Instagram
          </Button>
          <Button
            variant={selectedPlatform === 'twitter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlatform('twitter')}
            className={selectedPlatform === 'twitter' ? 'bg-blue-500 text-white' : ''}
          >
            Twitter
          </Button>
        </div>

        {/* Accessibility Features for Deaf Users */}
        {isDeaf && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <PhoneOff className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">
              No phone verification needed - Visual verification only
            </span>
          </div>
        )}

        {/* Engagement Prediction */}
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
          <Heart className="h-4 w-4 text-pink-500" />
          <span className="text-sm font-medium">{getEngagementPrediction()}</span>
        </div>

        {/* Caption Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Share Content:</label>
          <Textarea
            value={customCaption || getDeafOptimizedCaption()}
            onChange={(e) => setCustomCaption(e.target.value)}
            placeholder="Customize your caption..."
            className="min-h-[100px]"
          />
        </div>

        {/* Deaf Community Hashtags */}
        {isDeaf && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Deaf Community Tags:</label>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">#DeafCommunity</Badge>
              <Badge variant="secondary" className="text-xs">#DeafPride</Badge>
              {hasASLBadge && <Badge variant="secondary" className="text-xs">#ASLFluent</Badge>}
              <Badge variant="secondary" className="text-xs">#AccessibilityMatters</Badge>
              <Badge variant="secondary" className="text-xs">#InclusiveHiring</Badge>
              <Badge variant="secondary" className="text-xs">#DeafTalent</Badge>
            </div>
          </div>
        )}

        {/* Regular Hashtags */}
        {shareContent?.hashtagsOptimized && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Trending Hashtags:</label>
            <div className="flex flex-wrap gap-1">
              {shareContent.hashtagsOptimized.map((hashtag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {hashtag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Web3 & Accessibility Features Highlight */}
        <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Verification Highlights:</span>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            {walletAddress && <p>✓ Blockchain wallet connected</p>}
            {nftTokenId && <p>✓ Identity NFT minted</p>}
            {isDeaf && <p>✓ Deaf community verified</p>}
            {hasASLBadge && <p>✓ ASL fluency certified</p>}
            <p>✓ No phone verification required</p>
            <p>✓ Visual-first verification process</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => copyToClipboard(getDeafOptimizedCaption())}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          
          <Button
            onClick={() => window.open(getPlatformUrl(), '_blank')}
            size="sm"
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share on {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
          </Button>
        </div>

        {/* Sync Button */}
        <Button
          onClick={() => syncSocialMutation.mutate()}
          variant="outline"
          size="sm"
          disabled={syncSocialMutation.isPending}
          className="w-full"
        >
          <Users className="h-4 w-4 mr-1" />
          {syncSocialMutation.isPending ? 'Syncing...' : 'Sync Social Data'}
        </Button>

        {/* Performance Tips for Deaf Content Creators */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 Tips for {isDeaf ? 'deaf creators' : 'better engagement'}:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            {isDeaf ? (
              <>
                <li>Use clear visual storytelling</li>
                <li>Include captions or sign language</li>
                <li>Show your verification badges visually</li>
                <li>Connect with deaf community hashtags</li>
                <li>Highlight accessibility features in videos</li>
              </>
            ) : (
              <>
                <li>Post during peak hours (7-9pm)</li>
                <li>Include trending sounds for TikTok</li>
                <li>Show your NFT identity card in videos</li>
                <li>Use verification badge as proof of authenticity</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}