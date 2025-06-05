/**
 * Token Service
 * Manages JWT tokens for the application
 * 
 * Current Date: 2025-06-05 02:52:47 UTC
 * User: gabilang
 */
export default class TokenService {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.currentUser = options.currentUser || 'gabilang';
    
    // In a real app, these would come from your authentication API
    this._accessToken = this._generateMockToken('access');
    this._refreshToken = this._generateMockToken('refresh');
  }
  
  /**
   * Get current tokens
   */
  getTokens() {
    return {
      accessToken: this._accessToken,
      refreshToken: this._refreshToken,
      issuedAt: new Date().toISOString(),
      userId: this.currentUser
    };
  }
  
  /**
   * Refresh tokens - in a real app, this would call your auth API
   */
  async refreshTokens() {
    return new Promise(resolve => {
      setTimeout(() => {
        this._accessToken = this._generateMockToken('access');
        resolve(this.getTokens());
      }, 100);
    });
  }
  
  /**
   * Generate a mock token for development purposes
   * @private
   */
  _generateMockToken(type) {
    const header = btoa(JSON.stringify({
      alg: 'HS256',
      typ: 'JWT'
    }));
    
    const payload = btoa(JSON.stringify({
      sub: this.currentUser,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (type === 'access' ? 3600 : 86400 * 7),
      type: type
    }));
    
    const signature = btoa('_mock_signature_' + Math.random().toString(36).substr(2, 9));
    
    return `${header}.${payload}.${signature}`;
  }
}
