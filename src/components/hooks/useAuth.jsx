import { useState, useCallback } from 'react';

// This helper can stay outside the hook as it's a pure function.
const getAccessToken = (authData) => {
  if (!authData) return null;
  // Tapis v3 structure
  if (authData.result && authData.result.access_token && authData.result.access_token.access_token) {
    return authData.result.access_token.access_token;
  }
  // Other possible structures from Header component
  if (authData.access_token && typeof authData.access_token === 'string') {
    return authData.access_token;
  }
  if (authData.access_token && authData.access_token.access_token) {
    return authData.access_token.access_token;
  }
  return authData.token || null;
};

export const useAuth = () => {
  const [authInfo, setAuthInfo] = useState({
    isAuthenticated: false,
    token: null,
    user: null,
    expires_at: null,
    expires_in: null,
  });

  const handleAuthChange = useCallback((newAuthInfo) => {
    const accessToken = getAccessToken(newAuthInfo);
    const processedAuthInfo = {
      isAuthenticated: newAuthInfo.isAuthenticated || false,
      token: accessToken,
      user: newAuthInfo.user || newAuthInfo.result?.access_token?.sub || null,
      expires_at: newAuthInfo.result?.access_token?.expires_at || null,
      expires_in: newAuthInfo.result?.access_token?.expires_in || null,
    };
    setAuthInfo(processedAuthInfo);
  }, []);

  return { authInfo, handleAuthChange };
};