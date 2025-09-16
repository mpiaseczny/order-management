import { LitElement, html, css } from 'lit';
import '../components/login-form.js';

export class LoginPage extends LitElement {
  static styles = css``;

  render() {
    return html`<login-form></login-form>`;
  }
}

customElements.define('login-page', LoginPage);
