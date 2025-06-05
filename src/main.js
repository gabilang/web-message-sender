/**
 * Web App A - Token Provider
 * Main Entry Point
 * 
 * Current Date: 2025-06-05 02:52:47 UTC
 * User: gabilang
 */
import TokenService from './token-service';
import SecureCommunication from './secure-comm';

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Web App A at:', '2025-06-05 02:52:47 UTC');
  
  // Get the current user
  const currentUser = 'gabilang';
  
  // Create and configure the token service
  const tokenService = new TokenService({
    currentUser,
    debug: true
  });
  
  // Create and configure the secure communication manager
  const secureComm = new SecureCommunication({
    targetOrigin: 'http://localhost:3003',
    currentUser,
    debug: true
  });
  
  // Set the token service for the communication manager
  secureComm.setTokenService(tokenService);
  
  // Initialize the secure communication manager
  secureComm.init();
  
  // Set up the button click handler
  const openAppBButton = document.getElementById('openAppB');
  if (openAppBButton) {
    openAppBButton.addEventListener('click', () => {
      secureComm.openTargetApp();
    });
  }
  
  // Clean up before page unload
  window.addEventListener('beforeunload', () => {
    secureComm.disconnect();
  });
  
  console.log('Web App A initialized successfully');
});
