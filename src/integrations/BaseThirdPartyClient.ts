/**
 * Base Third Party API Client
 * Abstract base class for all third-party API integrations
 * Provides common HTTP methods and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { IThirdPartyClient } from './IThirdPartyClient';
import { ThirdPartyApiError } from '../errors/ThirdPartyApiError';

/**
 * Base Third Party API Client
 * Abstract base class - concrete implementations should be marked with @injectable()
 */
export abstract class BaseThirdPartyClient implements IThirdPartyClient {
  protected axiosInstance: AxiosInstance;
  protected baseUrl: string;
  protected timeout: number;
  protected retryAttempts: number;

  constructor(
    baseUrl: string,
    timeout: number = 30000,
    retryAttempts: number = 3,
    defaultHeaders?: Record<string, string>
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.retryAttempts = retryAttempts;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logger.info('Third-party API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
        });
        return config;
      },
      (error) => {
        logger.error('Third-party API request error', {
          error: error.message,
          stack: error.stack,
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.info('Third-party API response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // Retry logic
        type RetryConfig = AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

        const retryConfig = config as RetryConfig;

        if (this.shouldRetry(error) && (!retryConfig._retry || (retryConfig._retry && (retryConfig._retryCount ?? 0) < this.retryAttempts))) {
          retryConfig._retry = true;
          retryConfig._retryCount = (retryConfig._retryCount ?? 0) + 1;

          logger.warn('Retrying third-party API request', {
            url: retryConfig.url,
            attempt: retryConfig._retryCount,
            maxAttempts: this.retryAttempts,
          });

          // Exponential backoff
          const delay = Math.pow(2, retryConfig._retryCount!) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));

          return this.axiosInstance(retryConfig);
        }

        logger.error('Third-party API response error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          error: error.message,
          data: error.response?.data,
        });

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Determine if request should be retried
   */
  protected shouldRetry(error: AxiosError): boolean {
    if (!error.response) {
      // Network error - retry
      return true;
    }

    const status = error.response.status;
    // Retry on 5xx errors and 429 (Too Many Requests)
    return status >= 500 || status === 429;
  }

  /**
   * Handle and transform errors
   */
  protected handleError(error: AxiosError): Error {
    if (error.response) {
      const data: any = error.response.data;
  
      let message = 
        data?.message ||
        data?.error ||
        data?.defaultUserMessage ||
        data?.developerMessage ||
        error.response.statusText ||
        'Unknown error';
  
      // If validation errors exist — build a combined message
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        const validationMessages = data.errors
          .map((e: any) => e.defaultUserMessage || e.developerMessage || JSON.stringify(e))
          .join('; ');
        message = validationMessages;
      }
  
      return new ThirdPartyApiError(
        `API Error (${error.response.status}): ${message}`,
        error.response.status,
        data,
        error
      );
    }
  
    if (error.request) {
      return new ThirdPartyApiError(
        'Network Error: No response from server',
        undefined,
        undefined,
        error
      );
    }
  
    return new ThirdPartyApiError(
      `Request Error: ${error.message}`,
      undefined,
      undefined,
      error
    );
  }
  
  /**
   * GET request
   */
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
    uniqueIdentifier?: string
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
      return response.data;
    } catch (error: any) {
      logger.error('Error in GET request', {
        url,
        uniqueIdentifier,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * POST request
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    uniqueIdentifier?: string
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
      return response.data;
    } catch (error: any) {
      logger.error('Error in POST request', {
        url,
        uniqueIdentifier,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * PUT request
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    uniqueIdentifier?: string
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
      return response.data;
    } catch (error: any) {
      logger.error('Error in PUT request', {
        url,
        uniqueIdentifier,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * PATCH request
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    uniqueIdentifier?: string
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config);
      return response.data;
    } catch (error: any) {
      logger.error('Error in PATCH request', {
        url,
        uniqueIdentifier,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
    uniqueIdentifier?: string
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
      return response.data;
    } catch (error: any) {
      logger.error('Error in DELETE request', {
        url,
        uniqueIdentifier,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

