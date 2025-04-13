import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// Just use the module as is with any typing
// @ts-ignore

interface NftCard3DProps {
  walletAddress: string;
  tokenId: string;
  ownerName: string;
  verificationLevel: number;
  issueDate: string;
  backgroundColor?: string;
  highlightColor?: string;
}

export function NftCard3D({
  walletAddress,
  tokenId,
  ownerName,
  verificationLevel,
  issueDate,
  backgroundColor = '#1a1a2e',
  highlightColor = '#4361ee'
}: NftCard3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Setup THREE.js scene
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;
    
    // Initialize Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      50, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5;
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    
    // Create card geometry
    const cardWidth = 3.5;
    const cardHeight = 2.2;
    const cardGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, 0.05);
    
    // Create card materials
    const frontTexture = createCardTexture({
      walletAddress,
      tokenId,
      ownerName,
      verificationLevel,
      issueDate,
      backgroundColor,
      highlightColor
    });
    
    const backTexture = createCardBackTexture({
      walletAddress,
      backgroundColor,
      highlightColor
    });
    
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(highlightColor),
      metalness: 0.5,
      roughness: 0.2,
    });
    
    const materials = [
      edgeMaterial, // Right side
      edgeMaterial, // Left side
      edgeMaterial, // Top edge
      edgeMaterial, // Bottom edge
      new THREE.MeshStandardMaterial({ map: frontTexture }), // Front
      new THREE.MeshStandardMaterial({ map: backTexture }), // Back
    ];
    
    // Create card mesh
    const card = new THREE.Mesh(cardGeometry, materials);
    scene.add(card);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 2);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0x4361ee, 2, 10);
    pointLight.position.set(2, 1, 3);
    scene.add(pointLight);
    
    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      if (isRotating) {
        card.rotation.y += 0.01;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    
    window.addEventListener('resize', handleResize);
    
    // User interaction
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const relativeY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      card.rotation.y = relativeX * 0.5;
      card.rotation.x = relativeY * 0.2;
    };
    
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    
    // Toggle rotation on click
    const handleClick = () => {
      setIsRotating(!isRotating);
    };
    
    containerRef.current.addEventListener('click', handleClick);
    
    setIsInitialized(true);
    
    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('click', handleClick);
      }
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
    };
  }, [
    walletAddress, 
    tokenId, 
    ownerName, 
    verificationLevel, 
    issueDate, 
    backgroundColor, 
    highlightColor, 
    isRotating, 
    isInitialized
  ]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-96 rounded-lg overflow-hidden"
      title="Click to toggle automatic rotation"
    />
  );
}

// Helper function to create card front texture
function createCardTexture({
  walletAddress,
  tokenId,
  ownerName,
  verificationLevel,
  issueDate,
  backgroundColor,
  highlightColor
}: NftCard3DProps) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 648;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, backgroundColor || '#1a1a2e');
  gradient.addColorStop(1, adjustColor(backgroundColor || '#1a1a2e', -30));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add decorative elements
  drawCardDecoration(ctx, canvas.width, canvas.height, highlightColor || '#4361ee');
  
  // Logo and title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.fillText('FibonRoseID', 60, 80);
  
  ctx.font = '24px Arial';
  ctx.fillStyle = adjustColor(highlightColor || '#4361ee', 80);
  ctx.fillText('Secure Identity NFT', 64, 120);
  
  // Owner name
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(ownerName || 'Unknown', 60, 200);
  
  // Verification level badge
  drawVerificationBadge(ctx, verificationLevel, 60, 250, highlightColor || '#4361ee');
  
  // Card details
  ctx.font = '20px Arial';
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`Token ID: ${tokenId.substring(0, 20)}...`, 60, 320);
  ctx.fillText(`Issued: ${issueDate}`, 60, 360);
  
  // Wallet address (shortened)
  const shortAddress = walletAddress.substring(0, 6) + '...' + walletAddress.substring(walletAddress.length - 4);
  ctx.fillText(`Wallet: ${shortAddress}`, 60, 400);
  
  // Draw Fibonacci spiral as a security feature
  drawFibonacciSpiral(ctx, canvas.width - 200, canvas.height - 200, 150, highlightColor || '#4361ee');
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return texture;
}

// Helper function to create card back texture
function createCardBackTexture({
  walletAddress,
  backgroundColor,
  highlightColor
}: {
  walletAddress: string;
  backgroundColor: string;
  highlightColor: string;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 648;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, backgroundColor);
  gradient.addColorStop(1, adjustColor(backgroundColor, -30));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add decorative pattern
  drawBackPattern(ctx, canvas.width, canvas.height, highlightColor);
  
  // Draw QR code placeholder
  drawQRCodePlaceholder(ctx, canvas.width / 2, canvas.height / 2, 200, highlightColor);
  
  // Instructions text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Scan to verify identity', canvas.width / 2, canvas.height / 2 + 150);
  
  ctx.font = '20px Arial';
  ctx.fillStyle = '#cccccc';
  ctx.fillText('This NFT serves as your digital identity verification', canvas.width / 2, canvas.height / 2 + 200);
  ctx.fillText('Powered by NegraSecurity Framework', canvas.width / 2, canvas.height / 2 + 230);
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return texture;
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Draw decorative elements on the card
function drawCardDecoration(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  highlightColor: string
) {
  // Draw corner accent
  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(100, 0);
  ctx.lineTo(0, 100);
  ctx.closePath();
  ctx.fill();
  
  // Draw opposite corner accent
  ctx.beginPath();
  ctx.moveTo(width, height);
  ctx.lineTo(width - 100, height);
  ctx.lineTo(width, height - 100);
  ctx.closePath();
  ctx.fill();
  
  // Draw horizontal accent line
  ctx.strokeStyle = adjustColor(highlightColor, 30);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(50, 150);
  ctx.lineTo(width - 50, 150);
  ctx.stroke();
}

// Draw verification level badge
function drawVerificationBadge(
  ctx: CanvasRenderingContext2D, 
  level: number, 
  x: number, 
  y: number, 
  highlightColor: string
) {
  const radius = 30;
  
  // Draw circle
  ctx.beginPath();
  ctx.arc(x + radius, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = highlightColor;
  ctx.fill();
  
  // Draw text
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(level.toString(), x + radius, y + 8);
  
  // Reset text alignment
  ctx.textAlign = 'left';
  
  // Draw label
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Verification Level ${level}`, x + radius * 2 + 15, y + 8);
}

// Draw Fibonacci spiral as a security feature
function drawFibonacciSpiral(
  ctx: CanvasRenderingContext2D, 
  centerX: number, 
  centerY: number, 
  maxSize: number, 
  color: string
) {
  const phi = (1 + Math.sqrt(5)) / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  // Calculate starting size based on maximum size
  let size = maxSize / (phi * phi * phi);
  
  // Draw squares in a spiral
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 2;
    const newSize = size * Math.pow(phi, i);
    
    // Draw rounded square
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, newSize, angle, angle + Math.PI / 2);
    ctx.stroke();
  }
}

// Draw pattern for card back
function drawBackPattern(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  color: string
) {
  ctx.strokeStyle = adjustColor(color, -70);
  ctx.lineWidth = 1;
  
  // Draw subtle grid pattern
  const spacing = 30;
  for (let x = 0; x < width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 0; y < height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

// Draw QR code placeholder
function drawQRCodePlaceholder(
  ctx: CanvasRenderingContext2D, 
  centerX: number, 
  centerY: number, 
  size: number, 
  color: string
) {
  const halfSize = size / 2;
  
  // Draw outer square
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(centerX - halfSize, centerY - halfSize, size, size);
  
  // Draw inner patterns (typical QR code positioning markers)
  const markerSize = size / 5;
  const markerOffset = halfSize - markerSize - 5;
  
  // Draw position markers
  drawPositionMarker(ctx, centerX - markerOffset, centerY - markerOffset, markerSize, color);
  drawPositionMarker(ctx, centerX + markerOffset, centerY - markerOffset, markerSize, color);
  drawPositionMarker(ctx, centerX - markerOffset, centerY + markerOffset, markerSize, color);
  
  // Draw data dots to simulate QR code
  ctx.fillStyle = color;
  const dotSize = size / 25;
  const dotCount = 15;
  
  for (let i = 0; i < dotCount; i++) {
    for (let j = 0; j < dotCount; j++) {
      // Skip position marker areas
      const isInMarkerArea = (
        (i < 3 && j < 3) || 
        (i < 3 && j > dotCount - 4) || 
        (i > dotCount - 4 && j < 3)
      );
      
      if (!isInMarkerArea && Math.random() > 0.5) {
        const x = centerX - halfSize + (size / dotCount) * i;
        const y = centerY - halfSize + (size / dotCount) * j;
        ctx.fillRect(x, y, dotSize, dotSize);
      }
    }
  }
}

// Draw QR code position marker
function drawPositionMarker(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number, 
  color: string
) {
  const outerSize = size;
  const middleSize = size * 0.7;
  const innerSize = size * 0.4;
  
  // Outer square
  ctx.fillStyle = color;
  ctx.fillRect(x - outerSize/2, y - outerSize/2, outerSize, outerSize);
  
  // Middle square
  ctx.fillStyle = '#000000';
  ctx.fillRect(x - middleSize/2, y - middleSize/2, middleSize, middleSize);
  
  // Inner square
  ctx.fillStyle = color;
  ctx.fillRect(x - innerSize/2, y - innerSize/2, innerSize, innerSize);
}