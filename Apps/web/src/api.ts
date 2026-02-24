const API_URL = import.meta.env.VITE_API_URL || 'https://amber-business-health-monitor-1.onrender.com';

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        try {
          const data = await response.json();
          return { error: data.error || data.details || 'Request failed' };
        } catch {
          return { error: `Request failed with status ${response.status}` };
        }
      }

      const data = await response.json();
      return { data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      console.error(`[API Client] Error calling ${endpoint}:`, message);
      return { error: 'Network error - make sure backend is running at ' + API_URL };
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
      name: string;
      businessName: string;
      timezone: string;
      currency: string;
      role: string;
      createdAt: string;
    }>('/auth/me');
  }

  async updateSettings(
    name: string,
    businessName: string,
    timezone: string,
    currency: string
  ) {
    return this.request<{
      id: string;
      email: string;
      name: string;
      businessName: string;
      timezone: string;
      currency: string;
      role: string;
      createdAt: string;
    }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        name,
        businessName,
        timezone,
        currency,
      }),
    });
  }

  async createInvitation() {
    return this.request<{
      id: string;
      token: string;
      url: string;
    }>('/invitations', {
      method: 'POST',
    });
  }

  async getInvitation(token: string) {
    return this.request<{
      user: {
        id: string;
        email: string;
        name: string;
        businessName: string;
        timezone: string;
        currency: string;
        createdAt: string;
      };
    }>(`/invitations/${token}`);
  }

  async submitFeedback(token: string, expertName: string, opinion: string) {
    return this.request<{
      id: string;
      expertName: string;
      opinion: string;
      createdAt: string;
    }>(`/invitations/${token}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ expertName, opinion }),
    });
  }

  async getFeedback() {
    return this.request<Array<{
      id: string;
      expertName: string;
      opinion: string;
      createdAt: string;
    }>>('/invitations/feedback');
  }

  async getInvitations() {
    return this.request<Array<{
      id: string;
      token: string;
      createdAt: string;
      feedback: Array<{
        id: string;
        expertName: string;
        opinion: string;
        createdAt: string;
      }>;
    }>>('/invitations/list');
  }

  // Stripe integration methods
  async getStripeOAuthUrl() {
    return this.request<{ oauthUrl: string }>('/stripe/oauth/url');
  }

  async connectStripeWithKey(apiKey: string) {
    return this.request<{ message: string }>('/stripe/connect', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  }

  async getStripeStatus() {
    return this.request<{
      provider: string;
      status: string;
      connectedAt?: string;
      lastSyncAt?: string;
      error?: string;
    }>('/stripe/status');
  }

  async disconnectStripe() {
    return this.request<{ message: string }>('/stripe/disconnect', {
      method: 'DELETE',
    });
  }

  async syncStripe() {
    return this.request<{ message: string }>('/stripe/sync', {
      method: 'POST',
    });
  }

  async getStripeMetrics(period: 'day' | 'week' | 'month' = 'week', limit = 12) {
    return this.request<Array<{
      period: string;
      totalRevenue: number;
      refunds: number;
      netRevenue: number;
      newCustomers: number;
      activeSubscriptions: number;
      customerCount: number;
    }>>(`/stripe/metrics?period=${period}&limit=${limit}`);
  }

  // GoHighLevel integration methods
  async getGHLOAuthUrl() {
    return this.request<{ oauthUrl: string }>('/gohighlevel/oauth/url');
  }

  async connectGHLWithKey(apiKey: string, locationId: string) {
    return this.request<{ message: string }>('/gohighlevel/connect', {
      method: 'POST',
      body: JSON.stringify({ apiKey, locationId }),
    });
  }

  async getGHLStatus() {
    return this.request<{
      provider: string;
      status: string;
      connectedAt?: string;
      lastSyncAt?: string;
      locationId?: string;
      error?: string;
    }>('/gohighlevel/status');
  }

  async disconnectGHL() {
    return this.request<{ message: string }>('/gohighlevel/disconnect', {
      method: 'DELETE',
    });
  }

  async syncGHL() {
    return this.request<{ message: string }>('/gohighlevel/sync', {
      method: 'POST',
    });
  }

  async getGHLMetrics(period: 'week' | 'month' = 'week', limit = 12) {
    return this.request<Array<{
      period: string;
      leadsCount: number;
      appointmentsBooked: number;
      appointmentsShowed: number;
      appointmentsNoShow: number;
      showRate: number;
      opportunitiesWon: number;
      opportunitiesPipelineValue: number;
    }>>(`/gohighlevel/metrics?period=${period}&limit=${limit}`);
  }
}

export const apiClient = new ApiClient();
