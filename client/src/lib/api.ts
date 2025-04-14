/**
 * FibonroseTrust REST API Client
 * 
 * This client provides a convenient interface for interacting with the 
 * FibonroseTrust REST API from the frontend application.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

// API response structure
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  metadata?: Record<string, any>;
}

// Error structure
export interface ApiError {
  success: false;
  message: string;
  metadata?: {
    errorCode?: string;
    details?: Record<string, any>;
  };
}

export class FibonroseTrustApi {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiVersion: string;

  constructor(baseUrl = '/api', apiVersion = 'v1') {
    this.baseUrl = baseUrl;
    this.apiVersion = apiVersion;
    
    this.client = axios.create({
      baseURL: `${this.baseUrl}/${this.apiVersion}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add response interceptor for standardized error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Format error response consistently
        const apiError: ApiError = {
          success: false,
          message: 'An error occurred',
          metadata: {
            errorCode: 'UNKNOWN_ERROR'
          }
        };
        
        if (error.response) {
          // The request was made and the server responded with an error status
          apiError.message = error.response.data?.message || error.message;
          apiError.metadata = {
            ...apiError.metadata,
            ...error.response.data?.metadata,
            status: error.response.status,
            statusText: error.response.statusText
          };
        } else if (error.request) {
          // The request was made but no response was received
          apiError.message = 'No response received from server';
          apiError.metadata = {
            ...apiError.metadata,
            errorCode: 'NETWORK_ERROR'
          };
        } else {
          // Something happened in setting up the request
          apiError.message = error.message;
        }
        
        return Promise.reject(apiError);
      }
    );
  }
  
  // API User endpoints
  
  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }
  
  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/users/username/${username}`);
    return response.data;
  }
  
  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/users/me');
    return response.data;
  }
  
  /**
   * Create new user
   */
  async createUser(userData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post('/users', userData);
    return response.data;
  }
  
  /**
   * Get user's Fibonacci trust statistics
   */
  async getUserFibonacciStats(userId: number): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/users/${userId}/fibonacci-stats`);
    return response.data;
  }
  
  // API Trust Score endpoints
  
  /**
   * Get trust score for user
   */
  async getUserTrustScore(userId: number): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/trust-scores/user/${userId}`);
    return response.data;
  }
  
  /**
   * Update user's trust score
   */
  async updateUserTrustScore(userId: number): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/trust-scores/user/${userId}/update`);
    return response.data;
  }
  
  /**
   * Get all trust level definitions
   */
  async getTrustLevels(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/trust-scores/levels');
    return response.data;
  }
  
  /**
   * Get permissions for a specific trust level
   */
  async getTrustLevelPermissions(level: number): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/trust-scores/levels/${level}/permissions`);
    return response.data;
  }
  
  // API NFT endpoints
  
  /**
   * Get NFT by ID
   */
  async getNftById(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/nfts/${id}`);
    return response.data;
  }
  
  /**
   * Get NFTs for a user
   */
  async getUserNfts(userId: number): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/nfts/user/${userId}`);
    return response.data;
  }
  
  /**
   * Create new NFT verification
   */
  async createNftVerification(verificationData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post('/nfts/verification', verificationData);
    return response.data;
  }
  
  /**
   * Verify NFT authenticity
   */
  async verifyNft(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/nfts/${id}/verify`);
    return response.data;
  }
  
  // API Verification endpoints
  
  /**
   * Get all verification types
   */
  async getVerificationTypes(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/verifications/types');
    return response.data;
  }
  
  /**
   * Get verifications for a user
   */
  async getUserVerifications(userId: number): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/verifications/user/${userId}`);
    return response.data;
  }
  
  /**
   * Create new verification request
   */
  async createVerification(verificationData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post('/verifications', verificationData);
    return response.data;
  }
  
  /**
   * Update verification status
   */
  async updateVerificationStatus(id: number, status: string, verifiedBy?: string): Promise<ApiResponse<any>> {
    const response = await this.client.patch(`/verifications/${id}/status`, {
      status,
      verifiedBy
    });
    return response.data;
  }
  
  // API Security endpoints
  
  /**
   * Perform WHY verification
   */
  async performWhyVerification(verificationData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post('/security/why-verification', verificationData);
    return response.data;
  }
  
  /**
   * Perform risk assessment
   */
  async performRiskAssessment(assessmentData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post('/security/risk-assessment', assessmentData);
    return response.data;
  }
  
  /**
   * Get security recommendations for a user
   */
  async getSecurityRecommendations(userId: number): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/security/recommendations/user/${userId}`);
    return response.data;
  }
  
  // Common utility methods
  
  /**
   * Generic GET request
   */
  async get<T>(path: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<any, AxiosResponse<ApiResponse<T>>>(path, config);
    return response.data;
  }
  
  /**
   * Generic POST request
   */
  async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<any, AxiosResponse<ApiResponse<T>>>(path, data, config);
    return response.data;
  }
  
  /**
   * Generic PATCH request
   */
  async patch<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<any, AxiosResponse<ApiResponse<T>>>(path, data, config);
    return response.data;
  }
  
  /**
   * Generic DELETE request
   */
  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<any, AxiosResponse<ApiResponse<T>>>(path, config);
    return response.data;
  }
}

// Export singleton instance
export const api = new FibonroseTrustApi();
export default api;