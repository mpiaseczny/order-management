import { LitElement, html, css } from 'lit';
import '@lion/ui/define/lion-form.js';
import '@lion/ui/define/lion-input.js';
import '@lion/ui/define/lion-input-amount.js';
import '@lion/ui/define/lion-button-submit.js';
import { Required, MinNumber } from '@lion/ui/form-core.js';
import { apiService } from '../services/api.js';

export class OrderForm extends LitElement {
  static properties = {
    loading: { type: Boolean },
    error: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    h3 {
      margin-top: 0;
      color: #333;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .error {
      color: #d32f2f;
      background: #ffebee;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
    }

    .success {
      color: #2e7d32;
      background: #e8f5e8;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
    }

    lion-button-submit {
      margin-top: 10px;
    }

    .loading {
      opacity: 0.6;
      pointer-events: none;
    }
  `;

  constructor() {
    super();
    this.loading = false;
    this.error = '';
  }

  render() {
    return html`
      <div class="${this.loading ? 'loading' : ''}">
        <h3>Create New Order</h3>

        ${this.error ? html`<div class="error">${this.error}</div>` : ''}

        <lion-form @submit="${this.handleSubmit}">
          <form @submit="${ev => ev.preventDefault()}">
            <lion-input
              name="customerId"
              label="Customer ID"
              type="number"
              .validators="${[new Required(null, {getMessage: () => 'Customer ID is required'})]}"
              required>
            </lion-input>

            <lion-input
              name="description"
              label="Description"
              .validators="${[new Required(null, {getMessage: () => 'Description is required'})]}"
              required>
            </lion-input>

            <lion-button-submit ?disabled="${this.loading}">
              ${this.loading ? 'Creating Order...' : 'Create Order'}
            </lion-button-submit>
          </form>
        </lion-form>
      </div>
    `;
  }

  async handleSubmit(e) {
    const form = e.target;
    const formData = form.serializedValue;

    if (!formData.customerId || !formData.description) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (Number.isNaN(+formData.customerId) || +formData.customerId < 0) {
      this.error = 'Customer ID must be a non-negative number';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const orderData = {
        customerId: +formData.customerId,
        description: formData.description
      };

      await apiService.createOrder(orderData);

      form.resetGroup();

      const lionForm = this.shadowRoot.querySelector('lion-form')
      const successDiv = document.createElement('div');
      successDiv.className = 'success';
      successDiv.textContent = 'Order created successfully!';
      lionForm.parentNode.insertBefore(successDiv, lionForm);

      setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.parentNode.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }
}

customElements.define('order-form', OrderForm);
