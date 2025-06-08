import { useEffect, useState } from "react";
import { 
  CheckCircle, XCircle, AlertTriangle, Info, 
  Shield, Search, ServerCrash, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualFeedbackProps {
  icon: string;
  color: string;
  animation: string;
  vibration: boolean;
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

const iconMap = {
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-triangle': AlertTriangle,
  'info': Info,
  'shield': Shield,
  'search': Search,
  'server-crash': ServerCrash,
  'alert-circle': AlertCircle,
  'lock': Shield,
  'success': CheckCircle,
  'error': XCircle,
  'warning': AlertTriangle
};

const colorMap = {
  green: 'text-green-500 bg-green-50 border-green-200',
  red: 'text-red-500 bg-red-50 border-red-200',
  orange: 'text-orange-500 bg-orange-50 border-orange-200',
  blue: 'text-blue-500 bg-blue-50 border-blue-200',
  yellow: 'text-yellow-500 bg-yellow-50 border-yellow-200'
};

const animationMap = {
  bounce: 'animate-bounce',
  shake: 'animate-pulse',
  pulse: 'animate-pulse',
  fade: 'animate-in fade-in duration-300',
  none: ''
};

export function VisualFeedback({ 
  icon, 
  color, 
  animation, 
  vibration, 
  message, 
  duration = 3000,
  onComplete 
}: VisualFeedbackProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasVibrated, setHasVibrated] = useState(false);

  const IconComponent = iconMap[icon as keyof typeof iconMap] || Info;
  const colorClasses = colorMap[color as keyof typeof colorMap] || colorMap.blue;
  const animationClass = animationMap[animation as keyof typeof animationMap] || '';

  useEffect(() => {
    // Trigger vibration for deaf users
    if (vibration && !hasVibrated && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
      setHasVibrated(true);
    }

    // Auto-hide after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [vibration, hasVibrated, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 p-4 rounded-lg border-2 shadow-lg max-w-sm",
      "transition-all duration-300 transform",
      colorClasses,
      animationClass
    )}>
      <div className="flex items-center gap-3">
        <IconComponent className="h-6 w-6 flex-shrink-0" />
        {message && (
          <p className="text-sm font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}

export function useVisualFeedback() {
  const [feedback, setFeedback] = useState<VisualFeedbackProps | null>(null);

  const showFeedback = (props: Omit<VisualFeedbackProps, 'onComplete'>) => {
    setFeedback({
      ...props,
      onComplete: () => setFeedback(null)
    });
  };

  const showSuccess = (message: string) => {
    showFeedback({
      icon: 'check-circle',
      color: 'green',
      animation: 'bounce',
      vibration: true,
      message
    });
  };

  const showError = (message: string) => {
    showFeedback({
      icon: 'x-circle',
      color: 'red',
      animation: 'shake',
      vibration: true,
      message
    });
  };

  const showWarning = (message: string) => {
    showFeedback({
      icon: 'alert-triangle',
      color: 'orange',
      animation: 'pulse',
      vibration: true,
      message
    });
  };

  const showInfo = (message: string) => {
    showFeedback({
      icon: 'info',
      color: 'blue',
      animation: 'fade',
      vibration: false,
      message
    });
  };

  return {
    feedback,
    showFeedback,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}