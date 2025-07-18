// 10 purple gradient colors for decile distribution
export const purpleGradientColors = [
  '#F8F4FF', // Very light lavender - 0-10%
  '#E8D5F2', // Light lavender - 10-20%
  '#D4B3E8', // Soft purple - 20-30%
  '#C191DE', // Light purple - 30-40%
  '#BD6FCB', // Mystic Magenta - 40-50%
  '#A855C7', // Medium purple - 50-60%
  '#9333EA', // Bright purple - 60-70%
  '#7C3AED', // Deep purple - 70-80%
  '#6B21A8', // Dark purple - 80-90%
  '#581C87'  // Very dark purple - 90-100%
];

// Visualization options for Gulf Coast InSAR data
export const visualizationOptions = [
  { value: 'displacement', label: 'Ground Displacement' },
  { value: 'velocity', label: 'Velocity' },
  { value: 'coherence', label: 'Coherence' },
  { value: 'elevation', label: 'Elevation' }
];

// Helper function to format numbers with 3 decimal places for legend
export const formatLegendNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  return num.toFixed(3);
};