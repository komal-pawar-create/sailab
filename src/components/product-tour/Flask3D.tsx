import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Animated floating sphere representing lab/science theme
const FloatingOrb = ({ position, color, size, speed }: { 
  position: [number, number, number]; 
  color: string; 
  size: number;
  speed: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.2;
    }
  });
  
  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position}>
        <Sphere args={[size, 64, 64]}>
          <MeshDistortMaterial
            color={color}
            transparent
            opacity={0.8}
            distort={0.4}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </mesh>
    </Float>
  );
};

// Bubble particles floating inside
const Bubbles = () => {
  const bubblesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (bubblesRef.current) {
      bubblesRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });
  
  const bubbles = Array.from({ length: 20 }, (_, i) => ({
    position: [
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3
    ] as [number, number, number],
    size: Math.random() * 0.08 + 0.02,
    speed: Math.random() * 0.5 + 0.5
  }));
  
  return (
    <group ref={bubblesRef}>
      {bubbles.map((bubble, i) => (
        <Float key={i} speed={bubble.speed} floatIntensity={0.5}>
          <mesh position={bubble.position}>
            <sphereGeometry args={[bubble.size, 16, 16]} />
            <meshStandardMaterial 
              color="#8B5CF6" 
              transparent 
              opacity={0.6}
              emissive="#8B5CF6"
              emissiveIntensity={0.3}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

// Main 3D Flask/Science visualization
const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0EA5E9" />
      
      {/* Main central orb - representing the flask body */}
      <FloatingOrb 
        position={[0, 0, 0]} 
        color="#8B5CF6" 
        size={1.2} 
        speed={1}
      />
      
      {/* Secondary orbs */}
      <FloatingOrb 
        position={[2, 1, -1]} 
        color="#0EA5E9" 
        size={0.4} 
        speed={1.5}
      />
      <FloatingOrb 
        position={[-2, -0.5, 0.5]} 
        color="#22C55E" 
        size={0.3} 
        speed={2}
      />
      <FloatingOrb 
        position={[1.5, -1.5, 1]} 
        color="#F59E0B" 
        size={0.25} 
        speed={1.8}
      />
      
      {/* Floating bubbles */}
      <Bubbles />
      
      <Environment preset="city" />
    </>
  );
};

// Loading fallback
const LoadingFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 animate-pulse" />
  </div>
);

interface Flask3DProps {
  className?: string;
}

const Flask3D: React.FC<Flask3DProps> = ({ className }) => {
  return (
    <div className={className}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default Flask3D;
