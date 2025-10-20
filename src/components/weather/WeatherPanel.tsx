import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wind, Eye, Droplets, Thermometer, Loader } from 'lucide-react';
import { fetchWeatherData, getWeatherInfo, formatDateToChinese, WeatherData } from '@/lib/open-meteo-api';

interface WeatherPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const WeatherPanel: React.FC<WeatherPanelProps> = ({ isOpen, onClose }) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [weatherData, setWeatherData] = React.useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取天气数据
  React.useEffect(() => {
    if (isOpen && !weatherData) {
      loadWeatherData();
    }
  }, [isOpen]);

  const loadWeatherData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchWeatherData(); // 使用默认的北京坐标
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载天气数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 right-0 w-96 h-full bg-black/40 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50"
        >
          <div className="flex flex-col h-full p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">天气信息</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Time and Date */}
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-gray-400">
                {formatDate(currentTime)}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-neon-cyan mb-3" />
                <p className="text-gray-300">正在加载天气数据...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="glass-card rounded-xl p-6 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={loadWeatherData}
                  className="px-4 py-2 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan rounded-lg transition-colors"
                >
                  重新加载
                </button>
              </div>
            )}

            {/* Current Weather */}
            {weatherData && !isLoading && !error && (
              <>
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{weatherData.location.name}</h3>
                      <p className="text-sm text-gray-400">当前天气</p>
                    </div>
                    {React.createElement(getWeatherInfo(weatherData.current.weatherCode).icon, {
                      className: "w-10 h-10 text-neon-cyan"
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-4xl font-bold text-white">{weatherData.current.temperature}°C</div>
                    <div className="text-right">
                      <div className="text-white">{getWeatherInfo(weatherData.current.weatherCode).condition}</div>
                      <div className="text-sm text-gray-400">体感温度 {weatherData.current.apparentTemperature}°C</div>
                    </div>
                  </div>

                  {/* Weather Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-neon-cyan" />
                      <span className="text-sm text-gray-300">湿度 {weatherData.current.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-neon-cyan" />
                      <span className="text-sm text-gray-300">风速 {weatherData.current.windSpeed} km/h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-neon-cyan" />
                      <span className="text-sm text-gray-300">能见度 {weatherData.current.visibility} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-neon-cyan" />
                      <span className="text-sm text-gray-300">体感良好</span>
                    </div>
                  </div>
                </div>

                {/* 24 Hour Forecast */}
                <div className="glass-card rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-4">24小时预报</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 dynamic-scrollbar" style={{'--scrollbar-color': '#22D3EE'} as React.CSSProperties}>
                    {weatherData.hourly.slice(0, 6).map((item, index) => {
                      const weatherInfo = getWeatherInfo(item.weatherCode);
                      const displayTime = index === 0 ? '现在' : item.time;
                      
                      return (
                        <div key={index} className="flex-shrink-0 text-center min-w-[60px]">
                          <div className="text-xs text-gray-400 mb-2">{displayTime}</div>
                          {React.createElement(weatherInfo.icon, {
                            className: "w-5 h-5 text-neon-cyan mx-auto mb-2"
                          })}
                          <div className="text-sm text-white">{item.temperature}°</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 7 Day Forecast */}
                <div className="glass-card rounded-xl p-4 flex-1">
                  <h4 className="text-sm font-semibold text-white mb-4">7天预报</h4>
                  <div className="space-y-3">
                    {weatherData.daily.slice(0, 5).map((item, index) => {
                      const weatherInfo = getWeatherInfo(item.weatherCode);
                      
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-300 w-10">
                              {formatDateToChinese(item.date, index)}
                            </span>
                            {React.createElement(weatherInfo.icon, {
                              className: "w-4 h-4 text-neon-cyan"
                            })}
                            <span className="text-sm text-gray-400">{weatherInfo.condition}</span>
                          </div>
                          <div className="flex gap-2 text-sm">
                            <span className="text-white">{item.maxTemperature}°</span>
                            <span className="text-gray-400">{item.minTemperature}°</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Close hint */}
            <div className="text-center">
              <div className="text-xs text-gray-500">
                向右拖拽或点击关闭按钮返回
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WeatherPanel;
