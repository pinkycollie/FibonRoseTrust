import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, MapPin, Award, MessageCircle, Phone, 
  Mail, Star, Users, Shield, CheckCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfessionalDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [onlyASLFluent, setOnlyASLFluent] = useState(false);
  const [page, setPage] = useState(1);

  // Fetch professional roles
  const { data: roles } = useQuery({
    queryKey: ['/api/v1/professionals/roles'],
  });

  // Fetch public professional directory
  const { data: directoryData, isLoading } = useQuery({
    queryKey: ['/api/v1/professionals/directory', {
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      location: selectedLocation || undefined,
      aslFluent: onlyASLFluent || undefined,
      page,
      limit: 12
    }],
  });

  const profiles = directoryData?.profiles || [];
  const pagination = directoryData?.pagination || {};

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "healthcare", label: "Healthcare", icon: "❤️" },
    { value: "legal", label: "Legal Services", icon: "⚖️" },
    { value: "financial", label: "Financial Services", icon: "💰" },
    { value: "education", label: "Education", icon: "📚" },
    { value: "business", label: "Business Services", icon: "🏢" },
    { value: "communication", label: "Communication", icon: "🗣️" },
  ];

  const getBadgeColor = (badgeName: string) => {
    const colors: Record<string, string> = {
      identity_verified: "bg-green-500",
      asl_fluent: "bg-purple-500",
      deaf_community_verified: "bg-blue-500",
      professional_verified: "bg-yellow-500",
      trusted_provider: "bg-red-500",
    };
    return colors[badgeName] || "bg-gray-500";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Fibonrose Professional Directory
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Find verified professionals who serve the deaf community
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search professionals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon && `${cat.icon} `}{cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Location..."
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* ASL Fluency Toggle */}
            <Button
              variant={onlyASLFluent ? "default" : "outline"}
              onClick={() => setOnlyASLFluent(!onlyASLFluent)}
              className="w-full"
            >
              🤟 ASL Fluent Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
          {categories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value} className="text-xs sm:text-sm">
              <span className="hidden sm:inline">{cat.icon && `${cat.icon} `}</span>
              {cat.label.split(" ")[0]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading professionals...</p>
        </div>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No professionals found matching your criteria</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Professional Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {profiles.map((profile: any) => (
              <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile.userAvatar || undefined} />
                      <AvatarFallback className="text-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        {profile.userName?.split(' ').map((n: string) => n[0]).join('') || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{profile.userName}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        {profile.role?.displayName}
                      </CardDescription>
                      {profile.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {profile.location}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  {/* Experience and Languages */}
                  <div className="space-y-2 mb-4">
                    {profile.yearsOfExperience && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-gray-400" />
                        <span>{profile.yearsOfExperience} years experience</span>
                      </div>
                    )}
                    {profile.languages && profile.languages.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <MessageCircle className="h-4 w-4 text-gray-400" />
                        <span>{profile.languages.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {profile.aslFluent && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        🤟 ASL Fluent
                      </Badge>
                    )}
                    {profile.deafCommunityExperience && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        👥 Deaf Community
                      </Badge>
                    )}
                    {profile.isVerified && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Earned Badges */}
                  {profile.badges && profile.badges.length > 0 && (
                    <div className="flex gap-1 mb-4">
                      {profile.badges.slice(0, 4).map((userBadge: any) => (
                        <div
                          key={userBadge.id}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold"
                          title={userBadge.badge?.displayName}
                        >
                          {userBadge.badge?.icon || '⭐'}
                        </div>
                      ))}
                      {profile.badges.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                          +{profile.badges.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button variant="default" className="flex-1" size="sm">
                      <Mail className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
