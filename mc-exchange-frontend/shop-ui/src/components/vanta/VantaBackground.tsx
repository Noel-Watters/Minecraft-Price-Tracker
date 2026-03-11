'use client'
import { useEffect, useRef } from 'react'

type VantaEffect = {
  destroy: () => void;
};

type VantaWindow = typeof window & {
  VANTA?: {
    TOPOLOGY?: (options: Record<string, unknown>) => VantaEffect;
  };
};

export default function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<VantaEffect | null>(null);

  useEffect(() => {
    let animationFrame: number;

    function ensureVanta() {
      if (
        typeof window !== 'undefined' &&
        (window as VantaWindow).VANTA?.TOPOLOGY &&
        vantaRef.current &&
        !effectRef.current
      ) {
        effectRef.current = (window as VantaWindow).VANTA!.TOPOLOGY!({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          backgroundColor: 0x000000,
          color: 0x0cbff0,
        });
      }
      animationFrame = requestAnimationFrame(ensureVanta);
    }

    ensureVanta();

    return () => {
      cancelAnimationFrame(animationFrame);
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      className="absolute inset-0 z-0 pointer-events-none bg-black"
      style={{ width: '100%', height: '100%', position: 'absolute' }}
    />
  );
}