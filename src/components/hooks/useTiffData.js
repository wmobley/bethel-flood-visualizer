import { useState, useEffect, useCallback } from 'react';
import parseGeoraster from 'georaster';

// Helper: Fetches high-level info about the dataset from CKAN
const fetchDatasetInfo = async (token) => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error(`Invalid token: expected string, got ${typeof token}`);
    }
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    const response = await fetch('https://ckan.tacc.utexas.edu/api/3/action/package_show?id=gulf-coast-of-united-states-insar', {
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body from CKAN:', errorText);
      throw new Error(`Failed to fetch dataset info: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'CKAN API request was not successful');
    }
    
    return data.result;
  } catch (error) {
    console.error('Error fetching dataset info:', error);
    throw error;
  }
};

// Helper: Finds the URL of the latest TIFF file in the dataset
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

export const useTiffData = (authInfo) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tiffData, setTiffData] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);

  const loadTiffData = useCallback(async () => {
    if (!authInfo.isAuthenticated) {
      setError('Please log in to access the Gulf Coast InSAR TIFF data');
      return;
    }
    
    const actualToken = authInfo.token;
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
      
      const response = await fetch(tiffInfo.url, {
        headers: { 'Authorization': `Bearer ${actualToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch TIFF file: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const georaster = await parseGeoraster(arrayBuffer);
      
      const isGeographic = (
        georaster.xmin >= -180 && georaster.xmax <= 180 &&
        georaster.ymin >= -90 && georaster.ymax <= 90
      );
      
      const displayBounds = isGeographic ? {
        xmin: georaster.xmin, xmax: georaster.xmax, ymin: georaster.ymin, ymax: georaster.ymax, isProjected: false
      } : {
        xmin: -97.5, xmax: -80.0, ymin: 25.0, ymax: 30.5, isProjected: true,
        originalBounds: { xmin: georaster.xmin, xmax: georaster.xmax, ymin: georaster.ymin, ymax: georaster.ymax }
      };

      setTiffData({ georaster, info: tiffInfo, bounds: displayBounds });
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authInfo]);

  // Effect to load data when auth changes
  useEffect(() => {
    if (authInfo.isAuthenticated && authInfo.token && !tiffData && !loading) {
      loadTiffData();
    }
  }, [authInfo.isAuthenticated, authInfo.token, loadTiffData, tiffData, loading]);

  // Effect to clear data on logout
  useEffect(() => {
    if (!authInfo.isAuthenticated) {
      setTiffData(null);
      setDatasetInfo(null);
      setError(