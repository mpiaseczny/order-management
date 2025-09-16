import { LitElement, html, css } from 'lit';
import '../components/register-form.js';

export class RegisterPage extends LitElement {
  static styles = css``;

  render() {
    return html`<register-form></register-form>`;
  }
}

customElements.define('register-page', RegisterPage);
