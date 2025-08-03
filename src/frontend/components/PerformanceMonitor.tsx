import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface PerformanceData {
  cacheStats: {
    size: number;
    maxSize: number;
    hitRate: number;
    missRate: number;
  };
  queryStats: Record<string, {
    hits: number;
    misses: number;
    hitRate: number;
  }>;
  databaseStats: {
    totalQueries: number;
    cachedQueries: number;
    avgQueryTime: number;
    slowQueries: number;
  };
  apiStats: {
    totalCalls: number;
    avgResponseTime: number;
    failedCalls: number;
    rateLimitedCalls: number;
  };
}

export const PerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const theme = useSelector((state: RootState) => state.ui.theme);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        // In a real implementation, this would call the backend API
        // For now, we'll simulate the data
        const mockData: PerformanceData = {
          cacheStats: {
            size: Math.floor(Math.random() * 100) + 50,
            maxSize: 500,
            hitRate: Math.random() * 0.8 + 0.2,
            missRate: Math.random() * 0.3
          },
          queryStats: {
            'getActivePositions': {
              hits: Math.floor(Math.random() * 50) + 20,
              misses: Math.floor(Math.random() * 10) + 5,
              hitRate: Math.random() * 0.8 + 0.2
            },
            'getPosition': {
              hits: Math.floor(Math.random() * 100) + 50,
              misses: Math.floor(Math.random() * 20) + 10,
              hitRate: Math.random() * 0.7 + 0.3
            },
            'getConfig': {
              hits: Math.floor(Math.random() * 200) + 100,
              misses: Math.floor(Math.random() * 30) + 15,
              hitRate: Math.random() * 0.9 + 0.1
            }
          },
          databaseStats: {
            totalQueries: Math.floor(Math.random() * 1000) + 500,
            cachedQueries: Math.floor(Math.random() * 300) + 200,
            avgQueryTime: Math.random() * 50 + 10,
            slowQueries: Math.floor(Math.random() * 10)
          },
          apiStats: {
            totalCalls: Math.floor(Math.random() * 500) + 200,
            avgResponseTime: Math.random() * 200 + 50,
            failedCalls: Math.floor(Math.random() * 20),
            rateLimitedCalls: Math.floor(Math.random() * 5)
          }
        };

        setPerformanceData(mockData);
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      }
    };

    fetchPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (!performanceData) {
    return (
      <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Performance Monitor
        </h3>
        <div className="flex items-center space-x-2">
          <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-1"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-1 text-sm rounded ${
              theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Cache Statistics */}
      <div className="mb-4">
        <h4 className={`text-md font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
          Cache Performance
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cache Size</div>
            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {performanceData.cacheStats.size} / {performanceData.cacheStats.maxSize}
            </div>
          </div>
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Hit Rate</div>
            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {(performanceData.cacheStats.hitRate * 100).toFixed(1)}%
            </div>
          </div>
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Miss Rate</div>
            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {(performanceData.cacheStats.missRate * 100).toFixed(1)}%
            </div>
          </div>
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Efficiency</div>
            <div className={`text-lg font-semibold ${
              performanceData.cacheStats.hitRate > 0.7 ? 'text-green-500' : 
              performanceData.cacheStats.hitRate > 0.5 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {performanceData.cacheStats.hitRate > 0.7 ? 'Good' : 
               performanceData.cacheStats.hitRate > 0.5 ? 'Fair' : 'Poor'}
            </div>
          </div>
        </div>
      </div>

      {/* Database Statistics */}
      <div className="mb-4">
        <h4 className={`text-md font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
          Database Performance
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Queries</div>
            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {performanceData.databaseStats.totalQueries}
            </div>
          </div>
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cached Queries</div>
            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {performanceData.databaseStats.cachedQueries}
            </div>
          </div>
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Avg Query Time</div>
            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {performanceData.databaseStats.avgQueryTime.toFixed(1)}ms
            </div>
          </div>
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Slow Queries</div>
            <div className={`text-lg font-semibold ${
              performanceData.databaseStats.slowQueries === 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {performanceData.databaseStats.slowQueries}
            </div>
          </div>
        </div>
      </div>

      {/* API Statistics */}
      <div className="mb-4">
        <h4 className={`text-md font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
          API Performance
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Calls</div>
            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {performanceData.apiStats.totalCalls}
            </div>
          </div>
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Avg Response</div>
            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {performanceData.apiStats.avgResponseTime.toFixed(1)}ms
            </div>
          </div>
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Failed Calls</div>
            <div className={`text-lg font-semibold ${
              performanceData.apiStats.failedCalls === 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {performanceData.apiStats.failedCalls}
            </div>
          </div>
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Rate Limited</div>
            <div className={`text-lg font-semibold ${
              performanceData.apiStats.rateLimitedCalls === 0 ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {performanceData.apiStats.rateLimitedCalls}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Query Statistics */}
      {isExpanded && (
        <div className="mt-4">
          <h4 className={`text-md font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            Query Performance Details
          </h4>
          <div className={`rounded-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
              <div className="grid grid-cols-4 gap-4 text-sm font-medium">
                <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Query</div>
                <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Hits</div>
                <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Misses</div>
                <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Hit Rate</div>
              </div>
            </div>
            {Object.entries(performanceData.queryStats).map(([query, stats]) => (
              <div key={query} className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className={`font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {query}
                  </div>
                  <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {stats.hits}
                  </div>
                  <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {stats.misses}
                  </div>
                  <div className={`font-semibold ${
                    stats.hitRate > 0.7 ? 'text-green-500' : 
                    stats.hitRate > 0.5 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {(stats.hitRate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Alerts */}
      <div className="mt-4">
        <h4 className={`text-md font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
          Performance Alerts
        </h4>
        <div className="space-y-2">
          {performanceData.databaseStats.slowQueries > 0 && (
            <div className={`p-3 rounded-lg border-l-4 border-yellow-500 ${theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
              <div className={`text-sm ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-800'}`}>
                ⚠️ {performanceData.databaseStats.slowQueries} slow queries detected
              </div>
            </div>
          )}
          {performanceData.apiStats.failedCalls > 0 && (
            <div className={`p-3 rounded-lg border-l-4 border-red-500 ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'}`}>
              <div className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-800'}`}>
                ❌ {performanceData.apiStats.failedCalls} failed API calls
              </div>
            </div>
          )}
          {performanceData.apiStats.rateLimitedCalls > 0 && (
            <div className={`p-3 rounded-lg border-l-4 border-orange-500 ${theme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
              <div className={`text-sm ${theme === 'dark' ? 'text-orange-300' : 'text-orange-800'}`}>
                🚫 {performanceData.apiStats.rateLimitedCalls} rate-limited API calls
              </div>
            </div>
          )}
          {performanceData.cacheStats.hitRate < 0.5 && (
            <div className={`p-3 rounded-lg border-l-4 border-blue-500 ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                💡 Low cache hit rate - consider adjusting cache settings
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 