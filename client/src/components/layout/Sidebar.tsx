import { Link, useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  description?: string;
};

const navItems: NavItem[] = [
  { 
    href: "/", 
    label: "Dashboard", 
    icon: "dashboard",
    description: "Your verification overview" 
  },
  { 
    href: "/verifications", 
    label: "Verify", 
    icon: "security",
    description: "Complete identity verification" 
  },
  { 
    href: "/nft-authentication", 
    label: "NFT", 
    icon: "token",
    description: "NFT-based authentication" 
  },
  { 
    href: "/verification-history", 
    label: "History", 
    icon: "history",
    description: "View verification history" 
  },
  { 
    href: "/api-integrations", 
    label: "API", 
    icon: "api",
    description: "Manage API integrations" 
  },
  { 
    href: "/webhooks", 
    label: "Hooks", 
    icon: "webhook",
    description: "Set up webhook endpoints" 
  },
  { 
    href: "/settings", 
    label: "Settings", 
    icon: "settings",
    description: "Configure your account" 
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { isSidebarOpen, closeSidebar } = useSidebar();

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
                    <Link 
                      href={item.href}
                      onClick={() => {
                        if (isSidebarOpen) closeSidebar();
                      }}
                    >
                      <a 
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl transition-all hover:scale-105",
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
                      </a>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.description}</p>
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
                <div className="flex flex-col items-center cursor-pointer hover:opacity-80">
                  <div className="relative">
                    <img 
                      className="h-10 w-10 rounded-full object-cover border-2 border-primary-500" 
                      src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82" 
                      alt="User avatar" 
                    />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                  </div>
                  <span className="material-icons text-xs mt-1 text-primary-500">account_circle</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div>
                  <p className="font-medium">Jane Cooper</p>
                  <p className="text-xs text-gray-500">Level 3 Verified</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
