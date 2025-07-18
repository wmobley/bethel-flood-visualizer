import React from 'react';

const Legend = ({ config }) => {
  // Fallback configuration if no config is provided
  const defaultConfig = {
    title: 'Water Risk Legend',
    description: 'Based on risk values',
    visualizationType: 'risk',
    ranges: [
      { 
        color: '#581792',
        label: 'Loading...', 
        description: 'Loading data...'
      }
    ]
  };

  const legendConfig = config || defaultConfig;

  // Helper function to round numeric values to 2 decimals
  const formatValue = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    // If it's a string that contains numbers, try to format them
    if (typeof value === 'string' && legendConfig.visualizationType === 'stream-gauge-distribution') {
      return value.replace(/\d+\.?\d*/g, (match) => {
        const num = parseFloat(match);
        return isNaN(num) ? match : num.toFixed(2);
      });
    }
    return value;
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] p-4 bg-white bg-opacity-90 rounded-lg shadow-lg border border-gray-200 max-w-xs">
      <h3 className="text-sm font-semibold mb-3 text-gray-800">{legendConfig.title}</h3>
      
      <ul className="space-y-2">
        {legendConfig.ranges.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-start">
            <span 
              className="w-4 h-4 inline-block mr-3 rounded-sm flex-shrink-0 mt-0.5 border border-gray-300"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-700">
                {formatValue(item.label)}
              </div>
              <div className="text-xs text-gray-500">
                {formatValue(item.description)}
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 italic">
          {legendConfig.description} - Higher numbers indicate higher {legendConfig.visualizationType}
        </p>
      </div>
    </div>
  );
};

export default Legend;
