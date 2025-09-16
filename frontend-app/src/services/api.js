import { authService } from './auth.js';
import { ajax } from '@lion/ajax';

const API_BASE = 'http://localhost:8080/api';

class ApiService {
  async apiRequest(url, options = {}) {
    const { response, body } = await ajax.fetchJson(`${API_BASE}${url}`, {
      ...options,
      headers: {
        ...authService.getAuthHeaders()
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        authService.clearAuthData();
        throw new Error('Authentication required');
      }
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createOrder(orderData) {
    return this.apiRequest('/orders', {
      method: 'POST',
      body: orderData,
    });
  }

  async getOrders(activeOnly = false) {
    const url = activeOnly ? '/orders?activeOnly=true' : '/orders';
    return this.apiRequest(url);
  }

  async updateOrderStatus(id, status) {
    return this.apiRequest(`/orders/${id}/status`, {
      method: 'PUT',
      body: { status },
    });
  }
}

export const apiService = new ApiService();
