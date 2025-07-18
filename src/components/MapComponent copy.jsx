import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import parseGeoraster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
import Header from './Header';
import Legend from './Legend'; 
import { purpleGradientColors, visualizationOptions, formatLegendNumber } from '../utils/mapConstants';
import { useAuth } from './hooks/useAuth';
import { useLegend } from './hooks/useLegend';


const MapComponent = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tiffData, setTiffData] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [visualizationType, setVisualizationType] = useState('displacement');
  const { authInfo, handleAuthChange } = useAuth();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const currentLayerRef = useRef(null);

  const currentVisualization = useMemo(() => 
    visualizationOptions.find(opt => opt.value === visualizationType),
    [visualizationType]
  );

  const legendConfig = useLegend(currentVisualization, datasetInfo, visualizationType);

  useEffect(() => {
    if (authInfo.isAuthenticated && authInfo.token && !tiffData && !loading) {
      loadTiffData();
    }
  }, [authInfo.isAuthenticated, authInfo.token]);

  useEffect(() => {
    if (!authInfo.isAuthenticated) {
      setTiffData(null);
      setDatasetInfo(null);
      setError(null);
      
      if (currentLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(currentLayerRef.current);
        currentLayerRef.current = null;
      }
    }
  }, [authInfo.isAuthenticated]);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([28.0, -88.0], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || !tiffData) return;

    if (currentLayerRef.current) {
      try {
        mapRef.current.removeLayer(currentLayerRef.current);
        currentLayerRef.current = null;
      } catch (error) {
        console.error('Error removing existing layer:', error);
        currentLayerRef.current = null;
      }
    }

    try {
      const georaster = tiffData.georaster;
      const layer = new GeoRasterLayer({
        georaster,
        opacity: 0.7,
        resolution: 256, // Optional: adjust this for better performance
      });
      layer.addTo(mapRef.current);
      currentLayerRef.current = layer;

      const bounds = [
        [georaster.ymin, georaster.xmin],
        [georaster.ymax, georaster.xmax]
      ];
      mapRef.current.fitBounds(bounds);
    } catch (error) {
      console.error('Error adding GeoTIFF layer:', error);
    }
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

  const fetchDatasetInfo = async (token) => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const response = await fetch('https://ckan.tacc.utexas.edu/api/3/action/package_show?id=gulf-coast-of-united-states-insar', {
        headers
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

  const getLatestTiffUrl = (dataset) => {
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

    const sortedTiffs = tiffResources.sort((a, b) => {
      const dateA = new Date(a.created || a.last_modified || 0);
      const dateB = new Date(b.created || b.last_modified || 0);
      return dateB - dateA;
    });

    return {
      url: sortedTiffs[0].url,
      name: sortedTiffs[0].name,
      description: sortedTiffs[0].description,
      created: sortedTiffs[0].created,
      format: sortedTiffs[0].format
    };
  };

  const loadTiffData = async () => {
    if (!authInfo.isAuthenticated) {
      setError('Please log in to access the Gulf Coast InSAR TIFF data');
      return;
    }
    let actualToken = authInfo.token;
    if (actualToken && typeof actualToken === 'object' && actualToken.access_token) {
      actualToken = actualToken.access_token;
    }
    if (!actualToken || typeof actualToken !== 'string') {
      setError('Invalid authentication token');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const dataset = await fetchDatasetInfo(actualToken);
      setDatasetInfo(dataset);
      const tiffInfo = getLatestTiffUrl(dataset);
      
      try {
        const response = await fetch(tiffInfo.url, {
          headers: {
            'Authorization': `Bearer ${actualToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch TIFF file: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const georaster = await parseGeoraster(arrayBuffer);
        
        setTiffData({
          georaster,
          info: tiffInfo,
          isActualData: true
        });
        
      } catch (georasterError) {
        console.log('Georaster loading failed, using placeholder:', georasterError.message);
        
        setTiffData({
          placeholder: true,
          info: tiffInfo,
          isActualData: false,
          error: georasterError.message
        });
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <main
        className={`absolute top-0 right-0 bottom-0 transition-all duration-300 ease-in-out ${
          isPanelOpen ? 'left-80 md:left-96' : 'left-0'
        }`}
      >
        <div className="relative h-full w-full">
          <Header onAuthChange={handleAuthChange} onVisualizationChange={setVisualizationType} />
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

          {!authInfo.isAuthenticated && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[999] bg-yellow-100 border border-yellow-300 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Please log in to access DYNAMO TIFF data
              </p>
            </div>
          )}

          {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[999] bg-red-100 border border-red-300 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
              {authInfo.isAuthenticated && (
                <button 
                  onClick={loadTiffData}
                  className="mt-2 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        {legendConfig && <Legend config={legendConfig} />}
        </div>
      </main>
    </div>
  );
};

export default MapComponent;