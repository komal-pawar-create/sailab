import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Laptop mockup with floating effect
const Laptop = ({ position }: { position: [number, number, number] }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });
  
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} position={position}>
        {/* Screen */}
        <RoundedBox args={[3, 2, 0.1]} radius={0.05} position={[0, 1, 0]}>
          <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        {/* Screen content area */}
        <mesh position={[0, 1, 0.06]}>
          <planeGeometry args={[2.8, 1.8]} />
          <meshBasicMaterial color="#8B5CF6" opacity={0.3} transparent />
        </mesh>
        {/* Base */}
        <RoundedBox args={[3.2, 0.1, 2]} radius={0.05} position={[0, -0.05, 0.9]}>
          <meshStandardMaterial color="#2a2a4a" metalness={0.9} roughness={0.1} />
        </RoundedBox>
        {/* Keyboard area */}
        <mesh position={[0, 0.01, 0.9]}>
          <planeGeometry args={[2.8, 1.6]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
    </Float>
  );
};

// Phone mockup
const Phone = ({ position }: { position: [number, number, number] }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4 + 1) * 0.15;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });
  
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.8}>
      <group ref={groupRef} position={position}>
        {/* Phone body */}
        <RoundedBox args={[0.8, 1.6, 0.08]} radius={0.08}>
          <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
        </RoundedBox>
        {/* Screen */}
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[0.7, 1.4]} />
          <meshBasicMaterial color="#0EA5E9" opacity={0.4} transparent />
        </mesh>
      </group>
    </Float>
  );
};

// Tablet mockup
const Tablet = ({ position }: { position: [number, number, number] }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35 + 2) * 0.1;
    }
  });
  
  return (
    <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.6}>
      <group ref={groupRef} position={position}>
        {/* Tablet body */}
        <RoundedBox args={[1.8, 2.4, 0.06]} radius={0.06}>
          <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
        </RoundedBox>
        {/* Screen */}
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[1.6, 2.2]} />
          <meshBasicMaterial color="#22C55E" opacity={0.3} transparent />
        </mesh>
      </group>
    </Float>
  );
};

// Floating particles
const Particles = () => {
  const particlesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });
  
  const particles = Array.from({ length: 30 }, (_, i) => ({
    position: [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6
    ] as [number, number, number],
    size: Math.random() * 0.05 + 0.02
  }));
  
  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <Float key={i} speed={Math.random() + 0.5} floatIntensity={0.3}>
          <mesh position={particle.position}>
            <sphereGeometry args={[particle.size, 8, 8]} />
            <meshBasicMaterial color="#8B5CF6" transparent opacity={0.4} />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#8B5CF6" />
      <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.5} penumbra={1} />
      
      <Laptop position={[0, 0, 0]} />
      <Phone position={[2.5, -0.5, 0.5]} />
      <Tablet position={[-2.5, 0.3, 0.3]} />
      
      <Particles />
      
      <Environment preset="city" />
    </>
  );
};

const LoadingFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex gap-4">
      <div className="w-48 h-32 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
      <div className="w-20 h-40 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 animate-pulse" />
    </div>
  </div>
);

interface DeviceShowcaseProps {
  className?: string;
}

const DeviceShowcase: React.FC<DeviceShowcaseProps> = ({ className }) => {
  return (
    <div className={className}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default DeviceShowcase;
