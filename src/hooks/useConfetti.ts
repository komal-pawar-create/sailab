import confetti from 'canvas-confetti';
import { useCallback } from 'react';

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

export function useConfetti() {
  const fire = useCallback((options?: ConfettiOptions) => {
    const defaults: ConfettiOptions = {
      particleCount: 100,
      spread: 70,
      startVelocity: 30,
      decay: 0.95,
      scalar: 1,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444'],
    };

    confetti({
      ...defaults,
      ...options,
    });
  }, []);

  const fireSuccess = useCallback(() => {
    // Fire from both sides for a celebration effect
    const count = 150;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#10B981', '#34D399', '#6EE7B7'],
    };

    function fireOne(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fireOne(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fireOne(0.2, {
      spread: 60,
    });

    fireOne(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fireOne(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fireOne(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  const fireMilestone = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { 
      startVelocity: 30, 
      spread: 360, 
      ticks: 60, 
      zIndex: 9999,
      colors: ['#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B'],
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, []);

  const fireFromElement = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x, y },
      colors: ['#8B5CF6', '#0EA5E9', '#10B981'],
    });
  }, []);

  return {
    fire,
    fireSuccess,
    fireMilestone,
    fireFromElement,
  };
}
