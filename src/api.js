
const handleApiError = (error, response) => {
  console.error('API call failed:', error);
  if (response) {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  } else if (error.request) {
    throw new Error('No response from server');
  } else {
    throw new Error('Error setting up request');
  }
};

const getProxyToken = async (scriptId, action) => {
    const url = new URL('https://isa-scavenger-761151e3e681.herokuapp.com/get_token');
    try {
        const response = await fetch(url, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            script_id: scriptId, 
            action: action,
        }),
        });

        if (!response.ok) {
        const errorText = await response.text();
        handleApiError(new Error(errorText), response);
        }

        const data = await response.json();
        if (data.token) return data.token;
        throw new Error('Failed to get token: ' + JSON.stringify(data));
    } catch (error) {
        handleApiError(error);
    }
};

const apiCall = async (scriptId, action, additionalData = {}) => {
  try {
    const token = await getProxyToken(scriptId, action);
    const url = new URL('https://isa-scavenger-761151e3e681.herokuapp.com/proxy');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token, 
        action, 
        script_id: scriptId,
        password: localStorage.getItem('gamePassword'), // Add password to all requests
        ...additionalData 
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized access
        window.location.reload(); // Force re-authentication
        throw new Error('Authentication failed');
      }
      const errorText = await response.text();
      handleApiError(new Error(errorText), response);
    }

    const returnedData = response.json();
    return await returnedData;
  } catch (error) {
    handleApiError(error);
  }
};

export default apiCall;