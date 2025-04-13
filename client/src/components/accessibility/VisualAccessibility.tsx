import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function VisualAccessibility() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    
    if (highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }
    
    if (largeText) {
      root.classList.add('large-text-mode');
    } else {
      root.classList.remove('large-text-mode');
    }
    
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    return () => {
      root.classList.remove('high-contrast-mode', 'large-text-mode', 'reduced-motion');
    };
  }, [highContrast, largeText, reducedMotion]);

  return (
    <div className="fixed top-20 left-4 z-40 flex flex-col space-y-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={highContrast ? "default" : "outline"} 
              size="icon" 
              className="w-10 h-10"
              onClick={() => setHighContrast(!highContrast)}
            >
              <span className="material-icons">contrast</span>
              <span className="sr-only">High Contrast</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>High Contrast Mode</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={largeText ? "default" : "outline"} 
              size="icon"
              className="w-10 h-10"
              onClick={() => setLargeText(!largeText)}
            >
              <span className="material-icons">format_size</span>
              <span className="sr-only">Large Text</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Large Text Mode</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={reducedMotion ? "default" : "outline"} 
              size="icon"
              className="w-10 h-10"
              onClick={() => setReducedMotion(!reducedMotion)}
            >
              <span className="material-icons">motion_photos_off</span>
              <span className="sr-only">Reduced Motion</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Reduced Motion</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}