import { useDarkMode } from "@/hooks/use-dark-mode";
import { useSidebar } from "@/hooks/use-sidebar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function Header() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { openSidebar } = useSidebar();

  return (
    <div className="relative z-10 flex flex-shrink-0 h-16 bg-white dark:bg-neutral-800 shadow">
      <button
        className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={openSidebar}
        aria-label="Open sidebar"
      >
        <span className="material-icons text-xl">menu</span>
      </button>
      
      <div className="flex-1 flex justify-between px-2 sm:px-4">
        {/* Search - hidden on small screens, visible on md+ */}
        <div className="hidden md:flex flex-1 items-center max-w-lg">
          <div className="w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons text-gray-400 text-lg">search</span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                type="search"
                placeholder="Search verifications, users..."
              />
            </div>
          </div>
        </div>
        
        {/* Mobile title - visible only on small screens */}
        <div className="flex md:hidden flex-1 items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="material-icons text-white text-sm">fingerprint</span>
            </div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">FibonroseTrust</h1>
          </div>
        </div>
        
        {/* Right side controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search button for mobile */}
          <button className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <span className="material-icons text-xl">search</span>
          </button>
          
          {/* Dark mode toggle - hide label on mobile */}
          <div className="flex items-center">
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
              className="scale-90 sm:scale-100"
            />
            <Label htmlFor="dark-mode" className="sr-only">
              Dark Mode
            </Label>
          </div>
          
          {/* Notifications */}
          <button className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 relative">
            <span className="material-icons text-xl">notifications</span>
            {/* Notification badge */}
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* User avatar */}
          <div className="relative">
            <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500">
              <img
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82"
                alt="User avatar"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
