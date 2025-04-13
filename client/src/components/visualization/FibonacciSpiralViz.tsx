import { useRef, useEffect, useState } from 'react';
import { generateFibonacciSequence, getTrustLevelDescription } from '@/lib/utils/fibonacci';

interface FibonacciSpiralVizProps {
  score: number;
  maxScore: number;
  width?: number;
  height?: number;
  animationDuration?: number; // in ms
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  showLabels?: boolean;
}

export function FibonacciSpiralViz({
  score,
  maxScore,
  width = 400,
  height = 400,
  animationDuration = 2000,
  primaryColor = '#6366f1', // Indigo-500
  secondaryColor = '#a5b4fc', // Indigo-300
  backgroundColor = 'transparent',
  showLabels = true
}: FibonacciSpiralVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Generate Fibonacci sequence for visual representation
  const fibSequence = generateFibonacciSequence(
    Math.max(maxScore, 1000) // Ensure we have enough numbers
  ).slice(0, 20); // Limit to 20 numbers for visual clarity
  
  // Animation effect when score changes
  useEffect(() => {
    if (score === animatedScore) return;
    
    setIsAnimating(true);
    const startScore = animatedScore;
    const endScore = score;
    const startTime = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      
      if (elapsed >= animationDuration) {
        setAnimatedScore(endScore);
        setIsAnimating(false);
        return;
      }
      
      const progress = elapsed / animationDuration;
      // Ease-out cubic function for smoother animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const newScore = startScore + (endScore - startScore) * easedProgress;
      
      setAnimatedScore(newScore);
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [score, animatedScore, animationDuration]);
  
  // Draw the Fibonacci spiral
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background if specified
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Calculate center and scale
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / (Math.sqrt(fibSequence[fibSequence.length - 1]) * 2);
    
    // Create a glow effect for the active part of the spiral
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw the Fibonacci spiral
    drawFibonacciSpiral(ctx, centerX, centerY, scale, fibSequence, animatedScore);
    
    // Calculate and draw threshold markers
    if (showLabels) {
      drawThresholdMarkers(ctx, centerX, centerY, scale, fibSequence, animatedScore);
    }
    
    // Add visual pulsing effect to the end of the active spiral
    if (isAnimating) {
      drawPulsingEffect(ctx, centerX, centerY, scale, fibSequence, animatedScore);
    }
    
    // Draw current score in the center
    if (showLabels) {
      drawScoreDisplay(ctx, centerX, centerY, animatedScore, score);
    }
  }, [animatedScore, width, height, fibSequence, primaryColor, secondaryColor, backgroundColor, isAnimating, showLabels, score]);
  
  // Function to draw the Fibonacci spiral
  const drawFibonacciSpiral = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    scale: number,
    fibonacci: number[],
    currentScore: number
  ) => {
    // Starting angle
    let angle = 0;
    // Starting point is center
    let x = centerX;
    let y = centerY;
    // Radius for current arc
    let radius = 0;
    
    // Find which Fibonacci number corresponds to the current score
    let activeSegments = 0;
    for (let i = 0; i < fibonacci.length; i++) {
      if (currentScore >= fibonacci[i]) {
        activeSegments = i + 1;
      } else {
        break;
      }
    }
    
    // Draw each quarter arc of the spiral
    for (let i = 0; i < fibonacci.length * 4; i++) {
      const fibIndex = Math.floor(i / 4);
      const segmentAngle = Math.PI / 2; // 90 degrees
      
      // Calculate radius for this arc segment
      radius = Math.sqrt(fibonacci[fibIndex]) * scale;
      
      // Determine if this segment should be active (filled)
      const isActive = fibIndex < activeSegments || 
                       (fibIndex === activeSegments && 
                        currentScore >= fibonacci[fibIndex] * ((i % 4) / 4));
      
      // Set colors based on active state
      if (isActive) {
        // Active segment color with slight variation based on depth
        const hue = parseInt(primaryColor.slice(1), 16);
        const variation = (fibIndex % 4) * 10; // Slight color variation
        const adjustedHue = ((hue + variation) % 0xFFFFFF).toString(16).padStart(6, '0');
        ctx.strokeStyle = `#${adjustedHue}`;
        ctx.lineWidth = 4;
      } else {
        // Inactive segment
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 2;
      }
      
      // Starting and ending points for this arc segment
      const startAngle = angle;
      const endAngle = angle + segmentAngle;
      
      // Calculate center of this arc
      let arcCenterX, arcCenterY;
      
      // Each quarter we need to adjust the center of the arc
      switch (i % 4) {
        case 0: // 1st quarter
          arcCenterX = x;
          arcCenterY = y - radius;
          break;
        case 1: // 2nd quarter
          arcCenterX = x - radius;
          arcCenterY = y - radius;
          break;
        case 2: // 3rd quarter
          arcCenterX = x - radius;
          arcCenterY = y;
          break;
        case 3: // 4th quarter
          arcCenterX = x;
          arcCenterY = y;
          break;
        default:
          arcCenterX = x;
          arcCenterY = y;
      }
      
      // Draw arc
      ctx.beginPath();
      ctx.arc(arcCenterX, arcCenterY, radius, startAngle, endAngle, false);
      ctx.stroke();
      
      // Update angle for next segment
      angle = endAngle;
      
      // Update position for next segment
      if (i % 4 === 0) {
        x += radius;
      } else if (i % 4 === 1) {
        y += radius;
      } else if (i % 4 === 2) {
        x -= radius;
      } else if (i % 4 === 3) {
        y -= radius;
      }
    }
  };
  
  // Function to draw threshold markers
  const drawThresholdMarkers = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    scale: number,
    fibonacci: number[],
    currentScore: number
  ) => {
    // Draw markers at key Fibonacci thresholds
    for (let i = 0; i < Math.min(8, fibonacci.length); i++) {
      // Skip very small initial values
      if (i < 2) continue;
      
      const radius = Math.sqrt(fibonacci[i]) * scale;
      const angle = Math.PI / 4 * i; // Distribute markers around the spiral
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Marker style
      ctx.fillStyle = currentScore >= fibonacci[i] ? primaryColor : secondaryColor;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.font = '10px Arial';
      ctx.fillStyle = currentScore >= fibonacci[i] ? primaryColor : 'rgba(100, 100, 100, 0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Position the label slightly away from the marker
      const labelX = centerX + Math.cos(angle) * (radius + 15);
      const labelY = centerY + Math.sin(angle) * (radius + 15);
      
      // Draw level name rather than just the number
      const levelName = getTrustLevelDescription(i + 1);
      ctx.fillText(levelName, labelX, labelY);
    }
  };
  
  // Function to draw pulsing effect at the end of the active spiral
  const drawPulsingEffect = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    scale: number,
    fibonacci: number[],
    currentScore: number
  ) => {
    // Find which Fibonacci number corresponds to the current score
    let activeSegments = 0;
    for (let i = 0; i < fibonacci.length; i++) {
      if (currentScore >= fibonacci[i]) {
        activeSegments = i + 1;
      } else {
        break;
      }
    }
    
    // If we're between Fibonacci numbers, calculate position on the spiral
    let fibIndex = Math.min(activeSegments, fibonacci.length - 1);
    
    // Calculate radius for this point
    const radius = Math.sqrt(fibonacci[fibIndex]) * scale;
    
    // Calculate angle based on progress through the spiral
    const angle = (fibIndex * Math.PI / 2) % (Math.PI * 2);
    
    // Calculate position on the spiral
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    // Get current time for pulsing animation
    const time = Date.now() % 2000 / 2000; // 0 to 1 over 2 seconds
    const pulseSize = 5 + Math.sin(time * Math.PI * 2) * 3; // Pulse between 2 and 8
    
    // Draw pulsing circle
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x, y, pulseSize * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
  };
  
  // Function to draw current score in the center
  const drawScoreDisplay = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    currentScore: number,
    targetScore: number
  ) => {
    // Create circular background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Add subtle border
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw score
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = primaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Format score to have at most 1 decimal place
    const formattedScore = Math.round(currentScore * 10) / 10;
    ctx.fillText(formattedScore.toString(), centerX, centerY - 5);
    
    // Draw label
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(100, 100, 100, 0.9)';
    ctx.fillText('Trust Score', centerX, centerY + 15);
    
    // If still animating, draw arrow indicating direction
    if (currentScore !== targetScore) {
      const arrowChar = currentScore < targetScore ? '↑' : '↓';
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = currentScore < targetScore ? 'green' : 'red';
      ctx.fillText(arrowChar, centerX + 30, centerY - 5);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-2">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="touch-none"
      />
    </div>
  );
}