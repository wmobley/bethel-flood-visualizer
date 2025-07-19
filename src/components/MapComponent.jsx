import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { fromArrayBuffer } from 'geotiff';
import Legend from './Legend'; 
import { purpleGradientColors, visualizationOptions, formatLegendNumber } from '../utils/mapConstants';
import { useLegend } from './hooks/useLegend';

const MapComponent = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tiffData, setTiffData] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [visualizationType, setVisualizationType] = useState('displacement');
  const [availableRasters, setAvailableRasters] = useState([]);
  const [selectedRaster, setSelectedRaster] = useState(null);
  
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const currentLayerRef = useRef(null);

  const currentVisualization = useMemo(() => 
    visualizationOptions.find(opt => opt.value === visualizationType),
    [visualizationType]
  );

  const legendConfig = useLegend(currentVisualization, datasetInfo, visualizationType);

  useEffect(() => {
    loadDatasetInfo();
  }, []);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([28.0, -88.0], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (selectedRaster) {
      loadTiffData(selectedRaster);
    }
  }, [selectedRaster]);

  useEffect(() => {
    if (!mapRef.current || !tiffData || !tiffData.geotiff) return;

    if (currentLayerRef.current) {
      try {
        mapRef.current.removeLayer(currentLayerRef.current);
        currentLayerRef.current = null;
      } catch (error) {
        console.error('Error removing existing layer:', error);
        currentLayerRef.current = null;
      }
    }

    const renderTiffOverlay = async () => {
      try {
        const geotiff = tiffData.geotiff;
        const image = await geotiff.getImage();
        const bbox = image.getBoundingBox();
        const [xmin, ymin, xmax, ymax] = bbox;
        const imageBounds = [[ymin, xmin], [ymax, xmax]];

        const rasters = await image.readRasters({ interleave: true });
        const width = image.getWidth();
        const height = image.getHeight();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        const imageData = context.createImageData(width, height);
        const data = imageData.data;

        const min = -2;
        const max = 0.2;
        const range = max - min;

        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
        };
        const colorRamp = purpleGradientColors.map(hexToRgb);
        const numColors = colorRamp.length;

        for (let i = 0; i < rasters.length; i++) {
          const pixelValue = rasters[i];
          const j = i * 4;

          if (pixelValue === undefined || isNaN(pixelValue) || pixelValue < min) {
            data[j + 3] = 0; // Set alpha to 0 for transparent
          } else {
            const clampedValue = Math.max(min, Math.min(max, pixelValue));
            const normalized = (clampedValue - min) / range;
            const colorIndex = Math.min(numColors - 1, Math.floor(normalized * numColors));
            const color = colorRamp[colorIndex];

            if (color) {
              data[j] = color[0];     // R
              data[j + 1] = color[1]; // G
              data[j + 2] = color[2]; // B
              data[j + 3] = 255 * 0.7; // Alpha (with 70% opacity)
            } else {
              data[j + 3] = 0; // Fallback to transparent
            }
          }
        }

        context.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL();

        const overlay = L.imageOverlay(dataUrl, imageBounds, {
          opacity: 1, // Opacity is now baked into the image data
          interactive: false,
        });

        overlay.addTo(mapRef.current);
        currentLayerRef.current = overlay;
        mapRef.current.fitBounds(imageBounds);

      } catch (err) {
        console.error("Error rendering GeoTIFF to image overlay:", err);
        setError("Could not render the selected raster. It may be in an unsupported format.");
      }
    };

    renderTiffOverlay();
  }, [tiffData]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const checkMapHealth = () => {
      if (mapRef.current) {
        try {
          const center = mapRef.current.getCenter();
          const zoom = mapRef.current.getZoom();
          if (!center || isNaN(center.lat) || isNaN(center.lng) || isNaN(zoom)) {
            mapRef.current.setView([28.0, -88.0], 6);
          }
        } catch (error) {
          console.error('Map health check failed:', error);
        }
      }
    };

    const healthCheckInterval = setInterval(checkMapHealth, 5000);
    return () => clearInterval(healthCheckInterval);
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current.invalidateSize({ animate: true });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isPanelOpen]);

  const fetchDatasetInfo = async () => {
    try {
      const response = await fetch('https://ckan.tacc.utexas.edu/api/3/action/package_show?id=gulf-coast-of-united-states-insar', {
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch dataset info: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'API request was not successful');
      }
      return data.result;
    } catch (error) {
      console.error('Error fetching dataset info:', error);
      throw error;
    }
  };

  const getAllTiffResources = (dataset) => {
    if (!dataset || !dataset.resources) {
      throw new Error('No resources found in dataset');
    }

    const tiffResources = dataset.resources.filter(resource => 
      resource.format?.toLowerCase() === 'tiff' || 
      resource.format?.toLowerCase() === 'geotiff' ||
      resource.name?.toLowerCase().includes('.tif') ||
      resource.url?.toLowerCase().includes('.tif')
    );

    if (tiffResources.length === 0) {
      throw new Error('No TIFF files found in dataset');
    }

    // Sort by date (newest first) and add display names
    const sortedTiffs = tiffResources
      .sort((a, b) => {
        const dateA = new Date(a.created || a.last_modified || 0);
        const dateB = new Date(b.created || b.last_modified || 0);
        return dateB - dateA;
      })
      .map((resource, index) => ({
        ...resource,
        displayName: resource.name || `Raster ${index + 1}`,
        id: resource.id || `raster-${index}`
      }));

    return sortedTiffs;
  };

  const loadDatasetInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const dataset = await fetchDatasetInfo();
      setDatasetInfo(dataset);
      
      const tiffResources = getAllTiffResources(dataset);
      setAvailableRasters(tiffResources);
      
      // Auto-select the first (most recent) raster
      if (tiffResources.length > 0) {
        setSelectedRaster(tiffResources[0]);
      }
      
    } catch (err) {
      console.error('Error loading dataset info:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTiffData = async (rasterResource) => {
    if (!rasterResource) return;
    
    try {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(rasterResource.url, {
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch TIFF file: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const geotiff = await fromArrayBuffer(arrayBuffer);
        
        setTiffData({
          geotiff,
          info: rasterResource,
          isActualData: true
        });
        
      } catch (georasterError) {
        console.log('Georaster loading failed, using placeholder:', georasterError.message);
        
        setTiffData({
          placeholder: true,
          info: rasterResource,
          isActualData: false,
          error: georasterError.message
        });
      }
      
    } catch (err) {
      console.error('Error loading TIFF data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRasterChange = (e) => {
    const rasterId = e.target.value;
    const raster = availableRasters.find(r => r.id === rasterId);
    setSelectedRaster(raster);
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <main
        className={`absolute top-0 right-0 bottom-0 transition-all duration-300 ease-in-out ${
          isPanelOpen ? 'left-80 md:left-96' : 'left-0'
        }`}
      >
        <div className="relative h-full w-full">
          <header className="absolute top-0 left-1/2 -translate-x-1/2 z-[1000] mt-4 p-2 bg-white bg-opacity-90 rounded-lg shadow-lg min-w-fit max-w-4xl flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Gulf Coast of United States InSAR</h1>
            <div>
              <label htmlFor="raster-select" className="sr-only">Select Raster</label>
              <select 
                id="raster-select"
                onChange={handleRasterChange} 
                value={selectedRaster?.id || ''}
                className="p-1 border border-gray-300 rounded-md text-sm"
                disabled={loading || availableRasters.length === 0}
              >
                {availableRasters.length === 0 ? (
                  <option value="">Loading rasters...</option>
                ) : (
                  availableRasters.map(raster => (
                    <option key={raster.id} value={raster.id}>
                      {raster.displayName}
                    </option>
                  ))
                )}
              </select>
            </div>
          </header>
          {loading && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-[1001]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading DYNAMO TIFF data...</p>
              </div>
            </div>
          )}
          <div
            ref={mapContainerRef}
            className="h-full w-full"
            style={{ 
              minHeight: '400px', 
              position: 'relative', 
              zIndex: 1,
              backgroundColor: '#f0f0f0' 
            }}
            aria-label="Map showing DYNAMO TIFF data visualization"
          />

          {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[999] bg-red-100 border border-red-300 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
              
                <button 
                  onClick={loadDatasetInfo}
                  className="mt-2 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Retry
                </button>
            </div>
          )}
        {legendConfig && <Legend config={legendConfig} />}
        </div>
      </main>
    </div>
  );
};

export default MapComponent;