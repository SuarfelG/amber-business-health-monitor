import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  timeout: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  timeout: 30000,
};

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(baseURL?: string, retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    this.axiosInstance = axios.create({
      baseURL,
      timeout: this.retryConfig.timeout,
    });
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.requestWithRetry<T>('get', url, config);
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.requestWithRetry<T>('post', url, { ...config, data });
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.requestWithRetry<T>('put', url, { ...config, data });
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.requestWithRetry<T>('delete', url, config);
  }

  private async requestWithRetry<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.axiosInstance[method]<T>(url, config);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const shouldRetry = this.shouldRetry(error, attempt);

        if (!shouldRetry) {
          throw lastError;
        }

        const delayMs = this.calculateBackoffDelay(attempt);
        await this.sleep(delayMs);
      }
    }

    throw lastError;
  }

  private shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= this.retryConfig.maxRetries) {
      return false;
    }

    const axiosError = error as AxiosError;

    // Network timeout
    if (axiosError.code === 'ECONNABORTED') {
      return true;
    }

    // Rate limit
    if (axiosError.response?.status === 429) {
      return true;
    }

    // Server errors
    if (
      axiosError.response?.status &&
      axiosError.response.status >= 500
    ) {
      return true;
    }

    return false;
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^attempt
    return this.retryConfig.baseDelayMs * Math.pow(2, attempt);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const createHttpClient = (
  baseURL?: string,
  retryConfig?: Partial<RetryConfig>
): HttpClient => {
  return new HttpClient(baseURL, retryConfig);
};
