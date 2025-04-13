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
      >
        <span className="material-icons">menu</span>
      </button>
      <div className="flex-1 flex justify-between px-4">
        <div className="flex-1 flex items-center">
          <div className="max-w-2xl w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons text-gray-400">search</span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-gray-50 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                type="search"
                placeholder="Search"
              />
            </div>
          </div>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          {/* Dark mode toggle */}
          <div className="mr-3 flex items-center space-x-2">
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
            />
            <Label htmlFor="dark-mode" className="sr-only">
              Dark Mode
            </Label>
          </div>
          <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <span className="material-icons">notifications</span>
          </button>
          <div className="ml-3 relative">
            <div>
              <button className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82"
                  alt="User avatar"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
