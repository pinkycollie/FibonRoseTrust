import { Link, useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

type UserRole = 'user' | 'developer' | 'admin';

type NavItem = {
  href: string;
  label: string;
  icon: string;
  description?: string;
  roles?: UserRole[];
};

// Items accessible to all users
const userNavItems: NavItem[] = [
  { 
    href: "/", 
    label: "Dashboard", 
    icon: "dashboard",
    description: "Your verification overview",
    roles: ['user', 'developer', 'admin']
  },
  { 
    href: "/verifications", 
    label: "Verify", 
    icon: "security",
    description: "Complete identity verification",
    roles: ['user', 'developer', 'admin']
  },
  { 
    href: "/nft-authentication", 
    label: "NFT", 
    icon: "token",
    description: "NFT-based authentication",
    roles: ['user', 'developer', 'admin']
  },
  { 
    href: "/verification-history", 
    label: "History", 
    icon: "history",
    description: "View verification history",
    roles: ['user', 'developer', 'admin']
  },
  { 
    href: "/settings", 
    label: "Settings", 
    icon: "settings",
    description: "Configure your account",
    roles: ['user', 'developer', 'admin']
  },
];

// Developer and admin only items
const developerNavItems: NavItem[] = [
  { 
    href: "/api-integrations", 
    label: "API", 
    icon: "api",
    description: "Manage API integrations",
    roles: ['developer', 'admin']
  },
  { 
    href: "/webhooks", 
    label: "Hooks", 
    icon: "webhook",
    description: "Set up webhook endpoints",
    roles: ['developer', 'admin']
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const [userRole, setUserRole] = useState<UserRole>('user');
  
  // For demo purposes - would be fetched from authentication context in real app
  useEffect(() => {
    // Simulate fetching user role from API/auth context
    const hasDevPermission = sessionStorage.getItem('devMode') === 'true';
    setUserRole(hasDevPermission ? 'developer' : 'user');
  }, []);
  
  // Filter navigation items based on user role
  const getNavItems = () => {
    const allItems = [...userNavItems];
    
    // Only add developer items if user has permission
    if (userRole === 'developer' || userRole === 'admin') {
      allItems.push(...developerNavItems);
    }
    
    return allItems;
  };

  const navItems = getNavItems();

  return (
    <div 
      className={cn(
        "md:flex md:flex-shrink-0", 
        isSidebarOpen ? "fixed inset-0 z-40 block" : "hidden"
      )}
    >
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800">
        <div className="flex flex-col items-center justify-center h-20 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-icons text-white text-2xl">fingerprint</span>
            </div>
            <div className="flex items-center mt-1">
              <span className="material-icons text-primary-500 text-xs">shield</span>
              <span className="material-icons text-primary-500 text-xs mx-0.5">verified</span>
              <span className="material-icons text-primary-500 text-xs">security</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col flex-grow px-4 pt-5 pb-4 overflow-y-auto">
          <TooltipProvider>
            <nav className="flex-1 space-y-3">
              {navItems.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <div onClick={() => { if (isSidebarOpen) closeSidebar(); }}>
                      <Link href={item.href}>
                        <div 
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:scale-105 cursor-pointer",
                            location === item.href 
                              ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-100" 
                              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          )}
                        >
                          <span 
                            className={cn(
                              "material-icons text-2xl mb-1",
                              location === item.href 
                                ? "text-primary-500" 
                                : "text-gray-500"
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="text-xs font-medium">{item.label}</span>
                        </div>
                      </Link>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div>
                      <p>{item.description}</p>
                      {item.roles && item.roles.includes('developer') && !item.roles.includes('user') && (
                        <p className="text-xs text-orange-500 mt-1">Developer access required</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </TooltipProvider>
        </div>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="flex flex-col items-center cursor-pointer hover:opacity-80"
                  onClick={() => {
                    // Toggle dev mode for testing
                    const isDevMode = sessionStorage.getItem('devMode') === 'true';
                    sessionStorage.setItem('devMode', isDevMode ? 'false' : 'true');
                    setUserRole(isDevMode ? 'user' : 'developer');
                  }}
                >
                  <div className="relative">
                    <img 
                      className={`h-10 w-10 rounded-full object-cover border-2 ${
                        userRole === 'developer' ? 'border-yellow-500' : 'border-primary-500'
                      }`}
                      src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82" 
                      alt="User avatar" 
                    />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="material-icons text-xs text-primary-500 mr-1">account_circle</span>
                    {userRole === 'developer' && (
                      <span className="material-icons text-xs text-yellow-500">code</span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div>
                  <p className="font-medium">Jane Cooper</p>
                  <p className="text-xs text-gray-500">
                    {userRole === 'developer' 
                      ? 'Developer Access • Level 3 Verified' 
                      : 'Level 3 Verified'}
                  </p>
                  <p className="text-xs text-primary-500 mt-1">Click to toggle access level</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
