import { LitElement, html, css } from 'lit';
import '../components/order-form.js';
import '../components/orders-panel.js';

export class OrdersPage extends LitElement {
  static styles = css`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .welcome-message {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .welcome-message h2 {
      color: #333;
      margin: 0 0 0.5rem 0;
    }

    .welcome-message p {
      color: #666;
      margin: 0;
    }
  `;

  render() {
    return html`
      <div class="dashboard">
        <div class="welcome-message">
          <h2>Dashboard</h2>
          <p>Manage your orders and track real-time notifications</p>
        </div>
        <order-form></order-form>
        <orders-panel></orders-panel>
      </div>
    `;
  }
}

customElements.define('orders-page', OrdersPage);
