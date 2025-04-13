import { PropsWithChildren } from "react";
import { SidebarContext, useSidebarProvider } from "@/hooks/use-sidebar";
import { AuthContext, useAuthProvider } from "@/hooks/use-auth";
import { createContext, useContext } from "react";
import { useDarkMode } from "@/hooks/use-dark-mode";

type AppProvidersProps = PropsWithChildren<{}>;

export function AppProviders({ children }: AppProvidersProps) {
  const sidebarContext = useSidebarProvider();
  const authContext = useAuthProvider();

  return (
    <ThemeProvider>
      <AuthContext.Provider value={authContext}>
        <SidebarContext.Provider value={sidebarContext}>
          {children}
        </SidebarContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  setDarkMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: PropsWithChildren<{}>) {
  const { isDarkMode, toggleDarkMode, setDarkMode } = useDarkMode();

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
