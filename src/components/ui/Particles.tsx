
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/lib/ThemeProvider';

const Particles: React.FC = () => {
  const { providerColor } = useTheme();
  const [position, setPosition] = useState({ x: 50, y: 30 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // 使用正弦波创建流动效果，60秒完整循环
      const cycle = 60000;
      const progress = (now % cycle) / cycle;
      const angle = progress * Math.PI * 2;

      // 在 30%-70% 横向、10%-50% 纵向范围内缓慢移动
      const x = 50 + Math.sin(angle) * 20;
      const y = 30 + Math.cos(angle * 0.7) * 20;

      setPosition({ x, y });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 h-full w-full" style={{ zIndex: 5 }}>
      <div
        className="absolute left-0 right-0 top-0 h-full w-full transition-all duration-[2000ms] ease-out pointer-events-none"
        style={{
          background: `radial-gradient(circle 500px at ${position.x}% ${position.y}%, ${providerColor}20, transparent)`
        }}
      ></div>
    </div>
  );
};

export default Particles;
  