import React, { useEffect, useState } from 'react';
import { Activity, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkMessageLimit } from '@/lib/subscription-utils';
import { cn } from '@/lib/utils';

const UsageMeter: React.FC = () => {
  const navigate = useNavigate();
  const [usage, setUsage] = useState<{
    remaining: number;
    limit: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const result = await checkMessageLimit();
      setUsage({
        remaining: result.remaining,
        limit: result.limit,
      });
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!usage || usage.limit === -1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
        <Activity className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">无限制</span>
      </div>
    );
  }

  const percentage = (usage.remaining / usage.limit) * 100;
  const isLow = percentage < 20;
  const isVeryLow = percentage < 10;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300">
      <Activity className={cn(
        "w-4 h-4",
        isVeryLow ? "text-red-400" : isLow ? "text-yellow-400" : "text-gray-400"
      )} />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className={cn(
            "text-sm font-medium",
            isVeryLow ? "text-red-400" : isLow ? "text-yellow-400" : "text-gray-300"
          )}>
            今日剩余 {usage.remaining}/{usage.limit}
          </span>
        </div>

        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              isVeryLow
                ? "bg-red-500"
                : isLow
                ? "bg-yellow-500"
                : "bg-neon-cyan"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {isLow && (
        <button
          onClick={() => navigate('/pricing')}
          className="flex-shrink-0 p-1.5 rounded-full bg-neon-purple/20 hover:bg-neon-purple/30 transition-colors"
          title="升级订阅"
        >
          <Crown className="w-3.5 h-3.5 text-neon-purple" />
        </button>
      )}
    </div>
  );
};

export default UsageMeter;
