/**
 * Third Party API Client Interface
 * Defines the contract for all third-party API clients
 */

export interface IThirdPartyClient {
  /**
   * GET request
   */
  get<T = any>(url: string, config?: any, uniqueIdentifier?: string): Promise<T>;

  /**
   * POST request
   */
  post<T = any>(url: string, data?: any, config?: any, uniqueIdentifier?: string): Promise<T>;

  /**
   * PUT request
   */
  put<T = any>(url: string, data?: any, config?: any, uniqueIdentifier?: string): Promise<T>;

  /**
   * PATCH request
   */
  patch<T = any>(url: string, data?: any, config?: any, uniqueIdentifier?: string): Promise<T>;

  /**
   * DELETE request
   */
  delete<T = any>(url: string, config?: any, uniqueIdentifier?: string): Promise<T>;
}

