
import React from 'react';
import { useTheme } from '@/lib/ThemeProvider';

const Particles: React.FC = () => {
  const { providerColor } = useTheme();

  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-dark-bg-end bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      <div
        className="absolute left-0 right-0 top-0 -z-10 h-full w-full transition-colors duration-500"
        style={{
          background: `radial-gradient(circle 500px at 50% 200px, ${providerColor}20, transparent)`
        }}
      ></div>
    </div>
  );
};

export default Particles;
  