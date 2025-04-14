import { Link, useLocation } from "wouter";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/verifications", label: "Verifications", icon: "security" },
  { href: "/nft-authentication", label: "NFT Authentication", icon: "token" },
  { href: "/verification-history", label: "Verification History", icon: "history" },
  { href: "/api-integrations", label: "API Integrations", icon: "api" },
  { href: "/webhooks", label: "Webhooks", icon: "webhook" },
  { href: "/settings", label: "Settings", icon: "settings" },
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
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="material-icons text-white text-xl">fingerprint</span>
            </div>
            <span className="ml-2 text-xl font-semibold">FibonroseTrust</span>
          </div>
        </div>
        <div className="flex flex-col flex-grow px-4 pt-5 pb-4 overflow-y-auto">
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => {
                  if (isSidebarOpen) closeSidebar();
                }}
              >
                <a 
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    location === item.href 
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-700/20 dark:text-primary-100" 
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                >
                  <span 
                    className={cn(
                      "material-icons mr-3",
                      location === item.href 
                        ? "text-primary-500" 
                        : "text-gray-500"
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <img 
              className="h-8 w-8 rounded-full object-cover" 
              src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82" 
              alt="User avatar" 
            />
            <div className="ml-3">
              <p className="text-sm font-medium">Jane Cooper</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">jane@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
