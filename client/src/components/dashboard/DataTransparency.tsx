import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { DataPermission } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

type DataControlItemProps = {
  id: number;
  title: string;
  description: string;
  enabled: boolean;
};

function DataControlItem({ id, title, description, enabled }: DataControlItemProps) {
  const updateMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await apiRequest('PATCH', `/api/data-permission/${id}`, { enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/1/data-permissions'] });
    },
  });

  const handleToggle = (checked: boolean) => {
    updateMutation.mutate({ id, enabled: checked });
  };

  return (
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="ml-4 flex-shrink-0">
        <Switch 
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={updateMutation.isPending}
        />
      </div>
    </div>
  );
}

type DataControlKey = 'basic_profile' | 'verification_status' | 'trust_score_details' | 'transaction_history';

const dataControlInfo: Record<DataControlKey, { title: string; description: string }> = {
  basic_profile: {
    title: 'Basic Profile Information',
    description: 'Name, email, and profile photo',
  },
  verification_status: {
    title: 'Verification Status',
    description: 'Share your verification status with applications',
  },
  trust_score_details: {
    title: 'Trust Score Details',
    description: 'Allow applications to see your full trust score breakdown',
  },
  transaction_history: {
    title: 'Transaction History',
    description: 'Share your transaction history with applications',
  },
};

export function DataTransparency() {
  const { data: permissions, isLoading } = useQuery<DataPermission[]>({
    queryKey: ['/api/user/1/data-permissions'],
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <Skeleton className="h-5 w-36 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!permissions) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Data Transparency Controls</h2>
          <CardDescription>Manage what companies can see about your identity.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4">No data permission settings available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Data Transparency Controls</h2>
        <CardDescription>Manage what companies can see about your identity.</CardDescription>
      </CardHeader>
      <CardContent className="border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-6">
          {permissions.map((permission) => {
            const key = permission.permissionKey as DataControlKey;
            const info = dataControlInfo[key];
            
            return (
              <DataControlItem
                key={permission.id}
                id={permission.id}
                title={info.title}
                description={info.description}
                enabled={permission.enabled}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
