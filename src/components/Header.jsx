import React, { useState, useCallback } from 'react';

// Alternative approach using fetch directly to Tapis API
const Header = ({ onAuthChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    baseUrl: 'https://portals.tapis.io'
  });
  const [error, setError] = useState(null);

  // Memoize the auth change callback to prevent infinite re-renders
  const handleAuthChange = useCallback((authData) => {
    if (onAuthChange) {
      onAuthChange(authData);
    }
  }, [onAuthChange]);

  // Remove the useEffect that checks for saved authentication
  // This ensures user is logged out on page reload

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Try the Tapis v3 authentication endpoint
      const authUrl = `${credentials.baseUrl}/v3/oauth2/tokens`;
      
      // Create form data for OAuth2 password grant
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);
      formData.append('grant_type', 'password');

      console.log('Attempting authentication with:', authUrl);

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        console.error('Authentication failed:', response.status, responseText);
        throw new Error(`Authentication failed: ${response.status} - ${responseText}`);
      }

      let authResult;
      try {
        authResult = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from authentication server');
      }

      console.log('Authentication result:', authResult);

      // Handle different possible response structures
      let accessToken = null;
      if (authResult.access_token) {
        accessToken = authResult.access_token;
      } else if (authResult.result && authResult.result.access_token) {
        accessToken = authResult.result.access_token;
      } else if (authResult.data && authResult.data.access_token) {
        accessToken = authResult.data.access_token;
      }

      if (accessToken) {
        const userData = {
          username: credentials.username,
          baseUrl: credentials.baseUrl,
          tokenInfo: authResult
        };

        // Save to localStorage (optional - you might want to remove this too)
        localStorage.setItem('tapis_token', accessToken);
        localStorage.setItem('tapis_user', JSON.stringify(userData));

        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        setShowLoginForm(false);
        setCredentials({ ...credentials, password: '' }); // Clear password

        // Notify parent component
        handleAuthChange({ 
          isAuthenticated: true, 
          token: accessToken, 
          user: userData 
        });
      } else {
        console.error('No access token found in response:', authResult);
        throw new Error('Authentication failed - no access token received');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tapis_token');
    localStorage.removeItem('tapis_user');
    
    setUser(null);
    setIsAuthenticated(false);
    setShowLoginForm(false);
    setError(null);
    setCredentials({ ...credentials, password: '' });

    handleAuthChange({ isAuthenticated: false, token: null, user: null });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <header className="absolute top-0 left-1/2 -translate-x-1/2 z-[1000] mt-4 p-2 bg-white bg-opacity-90 rounded-lg shadow-lg min-w-fit max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Gulf Coast of United States InSAR
        </h1>
        
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Welcome, {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {!showLoginForm ? (
                <button
                  onClick={() => setShowLoginForm(true)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Login to TAPIS
                </button>
              ) : (
                <div className="relative">
                  <form onSubmit={handleLogin} className="flex items-center gap-1 md:gap-2">
                    <input
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={credentials.username}
                      onChange={handleInputChange}
                      required
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-20 md:w-auto"
                    />
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={credentials.password}
                      onChange={handleInputChange}
                      required
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                    >
                      {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLoginForm(false);
                        setError(null);
                      }}
                      className="px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </form>
                  
                  {error && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700 whitespace-nowrap z-10">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;