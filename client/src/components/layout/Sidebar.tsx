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
  {
    href: "/pinksync",
    label: "PinkSync",
    icon: "code",
    description: "Developer assistant and trigger engine",
    roles: ['developer', 'admin']
  },
  {
    href: "/docuhands",
    label: "DocuHands",
    icon: "description",
    description: "Documentation + automation scripting",
    roles: ['developer', 'admin']
  },
  {
    href: "/xano-console",
    label: "Xano",
    icon: "cloud",
    description: "Xano integration console",
    roles: ['developer', 'admin']
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const [userRole, setUserRole] = useState<UserRole>('user');
  
  // For demo purposes - would be fetched from authentication context in real app
  useEffect(() => {
    // In development environment, default to developer mode for easier access to all tools
    // If devMode is not set in sessionStorage, default to true for development
    const devMode = sessionStorage.getItem('devMode');
    if (devMode === null) {
      sessionStorage.setItem('devMode', 'true');
    }
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
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={closeSidebar}
        />
      )}
      
      <div 
        className={cn(
          "md:flex md:flex-shrink-0",
          // Mobile sidebar
          isSidebarOpen 
            ? "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0"
            : "fixed inset-y-0 left-0 z-40 w-64 transform -translate-x-full transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0"
        )}
      >
        <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800">
          {/* Header section */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="material-icons text-white text-xl">fingerprint</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">FibonroseTrust</h1>
                <div className="flex items-center space-x-1">
                  <span className="material-icons text-primary-500 text-xs">shield</span>
                  <span className="material-icons text-primary-500 text-xs">verified</span>
                  <span className="material-icons text-primary-500 text-xs">security</span>
                </div>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={closeSidebar}
              aria-label="Close sidebar"
            >
              <span className="material-icons text-xl">close</span>
            </button>
          </div>
          {/* Navigation */}
          <div className="flex flex-col flex-grow px-3 pt-4 pb-4 overflow-y-auto">
            <TooltipProvider>
              <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <div onClick={() => { if (isSidebarOpen) closeSidebar(); }}>
                        <Link href={item.href}>
                          <div 
                            className={cn(
                              "flex items-center p-3 rounded-xl transition-all cursor-pointer group",
                              "hover:scale-[1.02] active:scale-[0.98]",
                              location === item.href 
                                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-100 shadow-sm" 
                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            )}
                          >
                            <span 
                              className={cn(
                                "material-icons text-xl mr-3 flex-shrink-0",
                                location === item.href 
                                  ? "text-primary-500" 
                                  : "text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                              )}
                            >
                              {item.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium block truncate">{item.label}</span>
                              {item.description && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 block truncate mt-0.5">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            {item.roles && item.roles.includes('developer') && !item.roles.includes('user') && (
                              <span className="material-icons text-xs text-orange-500 ml-2">code</span>
                            )}
                          </div>
                        </Link>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="hidden md:block">
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
          
          {/* User profile section */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="flex items-center p-3 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      // Toggle dev mode for testing
                      const isDevMode = sessionStorage.getItem('devMode') === 'true';
                      sessionStorage.setItem('devMode', isDevMode ? 'false' : 'true');
                      setUserRole(isDevMode ? 'user' : 'developer');
                    }}
                  >
                    <div className="relative mr-3">
                      <img 
                        className={`h-10 w-10 rounded-full object-cover border-2 ${
                          userRole === 'developer' ? 'border-yellow-500' : 'border-primary-500'
                        }`}
                        src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82" 
                        alt="User avatar" 
                      />
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Jane Cooper</p>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Level 3 Verified</span>
                        {userRole === 'developer' && (
                          <span className="material-icons text-xs text-yellow-500">code</span>
                        )}
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden md:block">
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
    </>
  );
}
