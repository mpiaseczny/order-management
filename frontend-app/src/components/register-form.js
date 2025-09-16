import { LitElement, html, css } from 'lit';
import '@lion/ui/define/lion-form.js';
import '@lion/ui/define/lion-input.js';
import '@lion/ui/define/lion-button-submit.js';
import { Required, MinLength } from '@lion/ui/form-core.js';
import { authService } from '../services/auth.js';
import { Router } from '@vaadin/router';

export class RegisterForm extends LitElement {
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
        <h2>Register</h2>

        ${this.error ? html`<div class="error">${this.error}</div>` : ''}

        <lion-form @submit="${this.handleSubmit}">
          <form @submit="${ev => ev.preventDefault()}">
            <lion-input
              name="username"
              label="Username"
              .validators="${[new Required(null, {getMessage: () => 'Username is required'}), new MinLength(3, {getMessage: () => 'Username must be at least 3 characters long'})]}"
              required>
            </lion-input>

            <lion-input
              name="password"
              label="Password"
              type="password"
              .validators="${[new Required(null, {getMessage: () => 'Password is required'}), new MinLength(6, {getMessage: () => 'Password must be at least 6 characters long'})]}"
              required>
            </lion-input>

            <div class="form-actions">
              <lion-button-submit ?disabled="${this.loading}">
                ${this.loading ? 'Creating Account...' : 'Register'}
              </lion-button-submit>
            </div>
          </form>
        </lion-form>

        <div style="text-align: center; margin-top: 15px;">
          <button class="switch-mode" @click="${this.switchToLogin}">
            Already have an account? Login here
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

    if (formData.username.length < 3) {
      this.error = 'Username must be at least 3 characters long';
      return;
    }

    if (formData.password.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const requestData = {
        username: formData.username.trim(),
        password: formData.password,
      };

      await authService.register(requestData);

      this.dispatchEvent(new CustomEvent('user-authenticated', {
        detail: { user: authService.getUser() },
        bubbles: true,
        composed: true
      }));

      Router.go('/orders');
    } catch (error) {
      console.error('Registration error:', error);
      this.error = error.message || 'Registration failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  switchToLogin() {
    Router.go('/login');
  }
}

customElements.define('register-form', RegisterForm);
