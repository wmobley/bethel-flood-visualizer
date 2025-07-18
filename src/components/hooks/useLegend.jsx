import { useMemo } from 'react';
import { purpleGradientColors, formatLegendNumber } from '../../utils/mapConstants';

export const useLegend = (currentVisualization, datasetInfo, visualizationType) => {
  const legendConfig = useMemo(() => {
    if (!currentVisualization) return null;
    
    const min = -2;
    const max = 0.2;
    const numSteps = purpleGradientColors.length;
    const step = (max - min) / numSteps;

    return {
      title: `${currentVisualization.label} Legend`,
      description: `Gulf Coast InSAR Data ${datasetInfo?.name ? `(${datasetInfo.name})` : ''}`,
      visualizationType,
      ranges: purpleGradientColors.map((color, index) => {
        const rangeStart = min + index * step;
        const rangeEnd = rangeStart + step;
        
        return {
          color: color,
          label: `${formatLegendNumber(rangeStart)} - ${formatLegendNumber(rangeEnd)}`,
        };
      })
    };
  }, [currentVisualization, datasetInfo, visualizationType]);

  return legendConfig;
};