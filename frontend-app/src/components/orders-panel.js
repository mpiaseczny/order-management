import { LitElement, html, css } from 'lit';
import '@lion/ui/define/lion-checkbox.js';
import { apiService } from '../services/api.js';
import { notificationService } from '../services/kafka.js';

export class OrdersPanel extends LitElement {
  static properties = {
    orders: { state: true },
    loading: { type: Boolean },
    error: { type: String },
    activeOnly: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    h3 {
      margin-top: 0;
      color: #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .refresh-btn {
      background: #1976d2;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .refresh-btn:hover {
      background: #1565c0;
    }

    .refresh-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 12px 8px;
      text-align: left;
    }

    th {
      background: #f5f5f5;
      font-weight: 600;
      color: #333;
    }

    tr:nth-child(even) {
      background: #f9f9f9;
    }

    tr:hover {
      background: #f0f0f0;
    }

    .status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status.pending { background: #fff3cd; color: #856404; }
    .status.confirmed { background: #d4edda; color: #155724; }
    .status.processing { background: #cce5ff; color: #004085; }
    .status.shipped { background: #e2e3e5; color: #383d41; }
    .status.delivered { background: #d1ecf1; color: #0c5460; }
    .status.cancelled { background: #f8d7da; color: #721c24; }

    .status-select {
      padding: 4px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
    }

    .error {
      color: #d32f2f;
      background: #ffebee;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: #666;
      font-style: italic;
    }

    .notification {
      background: #e3f2fd;
      border: 1px solid #2196f3;
      color: #1976d2;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
      animation: fadeIn 0.3s ease-in;
    }

    .filter-container {
      margin-bottom: 15px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  constructor() {
    super();
    this.orders = [];
    this.loading = false;
    this.error = '';
    this.activeOnly = false;
    this.notificationUnsubscribe = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadOrders();
    this.subscribeToNotifications();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.notificationUnsubscribe) {
      this.notificationUnsubscribe();
    }
  }

  subscribeToNotifications() {
    this.notificationUnsubscribe = notificationService.subscribe(({ type, data }) => {
      if (type === 'order-created') {
        this.showNotification('New order created!');
        this.loadOrders();
      }
    });
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    const container = this.shadowRoot;
    container.insertBefore(notification, container.firstChild);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  async loadOrders() {
    this.loading = true;
    this.error = '';

    try {
      this.orders = await apiService.getOrders(this.activeOnly);
    } catch (error) {
      this.error = error.message;
      console.error('Failed to load orders:', error);
    } finally {
      this.loading = false;
    }
  }

  async handleStatusChange(orderId, newStatus) {
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      await this.loadOrders();
    } catch (error) {
      this.error = `Failed to update order status: ${error.message}`;
    }
  }

  handleActiveOnlyChange(e) {
    this.activeOnly = e.target.checked;
    this.loadOrders();
  }

  formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  }

  render() {
    return html`
      <div>
        <h3>
          Orders
          <button
            class="refresh-btn"
            @click="${this.loadOrders}"
            ?disabled="${this.loading}">
            ${this.loading ? 'Loading...' : 'Refresh'}
          </button>
        </h3>

        <div class="filter-container">
          <lion-checkbox
            label="Active only"
            .checked="${this.activeOnly}"
            @change="${this.handleActiveOnlyChange}">
          </lion-checkbox>
        </div>

        ${this.error ? html`<div class="error">${this.error}</div>` : ''}

        ${this.loading ? html`
          <div class="loading">Loading orders...</div>
        ` : this.orders.length === 0 ? html`
          <div class="empty">No orders found. Create your first order above!</div>
        ` : html`
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Creation Date</th>
                <th>Status</th>
                <th>Customer ID</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${this.orders.map(order => html`
                <tr>
                  <td>#${order.id}</td>
                  <td>${this.formatDate(order.createdAt)}</td>
                  <td>
                    <select
                      class="status-select"
                      .value="${order.status}"
                      @change="${(e) => this.handleStatusChange(order.id, e.target.value)}">
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                  <td>${order.customerId}</td>
                  <td>${order.description}</td>
                </tr>
              `)}
            </tbody>
          </table>
        `}
      </div>
    `;
  }
}

customElements.define('orders-panel', OrdersPanel);
