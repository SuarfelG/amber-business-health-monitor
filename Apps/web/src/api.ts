const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        return { error: data.error || 'Request failed' };
      }

      const data = await response.json();
      return { data };
    } catch (err) {
      return { error: 'Network error' };
    }
  }

  async register(
    email: string,
    password: string,
    name: string,
    businessName: string,
    timezone: string,
    currency: string
  ) {
    return this.request<{ accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name,
        businessName,
        timezone,
        currency,
      }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refresh() {
    return this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getMe() {
    return this.request<{
      id: string;
      email: string;
      role: string;
      createdAt: string;
    }>('/auth/me');
  }
}

export const apiClient = new ApiClient();
