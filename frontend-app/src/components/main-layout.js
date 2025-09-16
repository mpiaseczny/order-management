import { LitElement, html, css } from 'lit';
import { authService } from '../services/auth.js';
import { Router } from '@vaadin/router';

export class MainLayout extends LitElement {
  static properties = {
    isAuthenticated: { type: Boolean, state: true }
  }

  static styles = css`
    header {
      background: #1976d2;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    main {
      flex: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      width: 100%;
      box-sizing: border-box;
    }

    .logout-btn {
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .logout-btn:hover {
      background: rgba(255,255,255,0.3);
    }
  `;

  constructor() {
    super();
    this.user = JSON.parse(localStorage.getItem('user')) || null;
    this.isAuthenticated = !!this.user;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('user-authenticated', e => {
      this.user = e.detail.user;
      this.isAuthenticated = !!this.user;
    });
  }

  handleLogout() {
    authService.logout();
    this.user = null;
    this.isAuthenticated = false;
    Router.go('/login');
  }

  render() {
    return html`
      <header>
        <h1>Order Management System</h1>
        ${this.isAuthenticated ? html`
          <div>
            <span>Welcome, ${this.user.username}</span>
            <button class="logout-btn" @click=${this.handleLogout}>Logout</button>
          </div>
        ` : ''}
      </header>
      <main><slot></slot></main>
    `;
  }
}

customElements.define('main-layout', MainLayout);
