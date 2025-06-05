/**
 * Secure Communication Manager
 * Handles secure postMessage communication between windows
 * 
 * Current Date: 2025-06-05 02:52:47 UTC
 * User: gabilang
 */
export default class SecureCommunication {
  constructor(options = {}) {
    this.config = {
      targetOrigin: 'http://localhost:3003',
      currentUser: 'gabilang',
      debug: false,
      ...options
    };
    
    this.targetWindow = null;
    this.connectionStatus = 'disconnected';
    this.pendingRequests = {};
    this.connectionTimerId = null;
    
    // Bind methods
    this.handleMessage = this.handleMessage.bind(this);
  }
  
  /**
   * Initialize the communication manager
   */
  init() {
    window.addEventListener('message', this.handleMessage, false);
    
    if (this.config.debug) {
      console.log('[WebApp A] Secure communication manager initialized');
    }
  }
  
  /**
   * Open the target application in a new window/tab
   */
  openTargetApp() {
    const targetUrl = `${this.config.targetOrigin}/auth-callback?source=webapp-a&user=${this.config.currentUser}`;
    
    try {
      // Open the target window
      this.targetWindow = window.open(targetUrl, '_blank');
      
      if (!this.targetWindow) {
        this._updateStatus('Failed to open Web App B. Please check your popup blocker settings.', 'error');
        return false;
      }
      
      this._updateStatus('Opening Web App B and waiting for connection...', 'pending');
      
      // Set a timeout for the connection
      this.connectionTimerId = setTimeout(() => {
        this._updateStatus('Connection to Web App B timed out', 'error');
        this.connectionTimerId = null;
      }, 60000); // 1 minute timeout
      
      return true;
    } catch (error) {
      if (this.config.debug) {
        console.error('[WebApp A] Error opening target window:', error);
      }
      this._updateStatus('Error opening Web App B', 'error');
      return false;
    }
  }
  
  /**
   * Handle incoming messages
   */
  handleMessage(event) {
    // Always verify origin
    if (event.origin !== this.config.targetOrigin) {
      if (this.config.debug) {
        console.warn(`[WebApp A] Rejected message from unauthorized origin: ${event.origin}`);
      }
      return;
    }

    const { type, requestId, data } = event.data || {};
    
    if (this.config.debug) {
      console.log(`[WebApp A] Received message: ${type}`, event.data);
    }
    
    switch (type) {
      case 'HANDSHAKE_REQUEST':
        // Web App B is ready to receive tokens
        this.connectionStatus = 'connected';
        
        // Clear connection timer if running
        if (this.connectionTimerId) {
          clearTimeout(this.connectionTimerId);
          this.connectionTimerId = null;
        }
        
        this._updateStatus('Connection established with Web App B', 'success');
        
        // Acknowledge the handshake
        this._sendMessage({
          type: 'HANDSHAKE_RESPONSE',
          requestId,
          data: { 
            success: true,
            timestamp: new Date().toISOString(),
            sender: window.location.origin
          }
        });
        
        // Send tokens immediately after handshake
        this.sendTokens();
        break;
        
      case 'TOKEN_RECEIVED':
        // Web App B confirms token reception
        if (this.pendingRequests[requestId]) {
          delete this.pendingRequests[requestId];
          this._updateStatus('Tokens securely transferred!', 'success');
        }
        break;
    }
  }
  
  /**
   * Send tokens to the target window
   */
  sendTokens() {
    // Get fresh tokens from the token service
    const tokens = this.tokenService.getTokens();
    
    // Create a request ID for this token transmission
    const requestId = this._generateId();
    
    // Track this request
    this.pendingRequests[requestId] = {
      timestamp: Date.now(),
      type: 'TOKEN_TRANSFER'
    };
    
    // Send tokens securely
    this._sendMessage({
      type: 'TOKEN_TRANSFER',
      requestId,
      data: {
        tokens,
        userId: this.config.currentUser,
        issuedAt: new Date().toISOString()
      }
    });
    
    this._updateStatus('Sending tokens to Web App B...', 'pending');
    
    // Set a timeout to clean up this request
    setTimeout(() => {
      if (this.pendingRequests[requestId]) {
        delete this.pendingRequests[requestId];
        this._updateStatus('Token transfer timed out', 'error');
      }
    }, 30000); // 30 second timeout
    
    return requestId;
  }
  
  /**
   * Clean up resources
   */
  disconnect() {
    window.removeEventListener('message', this.handleMessage);
    this.targetWindow = null;
    this.connectionStatus = 'disconnected';
    this.pendingRequests = {};
    
    if (this.connectionTimerId) {
      clearTimeout(this.connectionTimerId);
      this.connectionTimerId = null;
    }
    
    if (this.config.debug) {
      console.log('[WebApp A] Communication manager disconnected');
    }
  }
  
  /**
   * Set token service
   */
  setTokenService(tokenService) {
    this.tokenService = tokenService;
  }
  
  /**
   * Send a message to the target window
   * @private
   */
  _sendMessage(message) {
    if (!this.targetWindow || this.targetWindow.closed) {
      this._updateStatus('Connection to Web App B has been lost', 'error');
      return false;
    }
    
    // Add security metadata
    const secureMessage = {
      ...message,
      metadata: {
        timestamp: new Date().toISOString(),
        sender: window.location.origin,
        // Set a short expiry time for the message
        expiresAt: new Date(Date.now() + 30000).toISOString() // 30 seconds
      }
    };
    
    try {
      this.targetWindow.postMessage(secureMessage, this.config.targetOrigin);
      
      if (this.config.debug) {
        console.log(`[WebApp A] Message sent: ${message.type}`, message);
      }
      
      return true;
    } catch (error) {
      if (this.config.debug) {
        console.error('[WebApp A] Error sending message:', error);
      }
      this._updateStatus('Error communicating with Web App B', 'error');
      return false;
    }
  }
  
  /**
   * Update status UI
   * @private
   */
  _updateStatus(message, type = 'pending') {
    const statusContainer = document.getElementById('statusContainer');
    const statusMessage = document.getElementById('statusMessage');
    
    if (statusContainer && statusMessage) {
      statusContainer.style.display = 'block';
      statusContainer.className = `status ${type}`;
      statusMessage.textContent = message;
    }
    
    if (this.config.debug) {
      console.log(`[WebApp A] ${message}`);
    }
  }
  
  /**
   * Generate a secure random ID
   * @private
   */
  _generateId(length = 32) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    randomValues.forEach(val => {
      result += characters.charAt(val % characters.length);
    });
    return result;
  }
}
