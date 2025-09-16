import { LitElement, html, css } from 'lit';
import '@lion/ui/define/lion-form.js';
import '@lion/ui/define/lion-input.js';
import '@lion/ui/define/lion-button-submit.js';
import { Required, MinLength } from '@lion/ui/form-core.js';
import { authService } from '../services/auth.js';
import { Router } from '@vaadin/router';

export class LoginForm extends LitElement {
  static properties = {
    loading: { type: Boolean },
    error: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 20px;
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

    .form-actions {
      display: flex;
      gap: 10px;
      justify-content: space-between;
      margin-top: 20px;
    }

    lion-button-submit {
      flex: 1;
    }

    .switch-mode {
      background: none;
      border: none;
      color: #1976d2;
      cursor: pointer;
      text-decoration: underline;
      padding: 10px;
    }

    .switch-mode:hover {
      color: #1565c0;
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
        <h2>Login</h2>

        ${this.error ? html`<div class="error">${this.error}</div>` : ''}

        <lion-form @submit="${this.handleSubmit}">
          <form @submit="${ev => ev.preventDefault()}">
            <lion-input
              name="username"
              label="Username"
              .validators="${[new Required(null, {getMessage: () => 'Username is required'})]}"
              required>
            </lion-input>

            <lion-input
              name="password"
              label="Password"
              type="password"
              .validators="${[new Required(null, {getMessage: () => 'Password is required'})]}"
              required>
            </lion-input>

            <div class="form-actions">
              <lion-button-submit ?disabled="${this.loading}">
                ${this.loading ? 'Logging in...' : 'Login'}
              </lion-button-submit>
            </div>
          </form>
        </lion-form>

        <div style="text-align: center; margin-top: 15px;">
          <button class="switch-mode" @click="${this.switchToRegister}">
            Don't have an account? Register here
          </button>
        </div>
      </div>
    `;
  }

  async handleSubmit(e) {
    const formData = e.target.serializedValue;

    if (!formData.username || !formData.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await authService.login({
        username: formData.username,
        password: formData.password,
      });

      this.dispatchEvent(new CustomEvent('user-authenticated', {
        detail: { user: authService.getUser() },
        bubbles: true,
        composed: true
      }));

      Router.go('/orders');
    } catch (error) {
      this.error = error.body.error;
    } finally {
      this.loading = false;
    }
  }

  switchToRegister() {
    Router.go('/register');
  }
}

customElements.define('login-form', LoginForm);
