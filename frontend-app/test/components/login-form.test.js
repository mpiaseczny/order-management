import { html } from 'lit';
import { fixture, expect, oneEvent } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/components/login-form.js';
import { authService } from '../../src/services/auth.js';
import { Router } from '@vaadin/router';

describe('LoginForm', () => {
  let element;
  let authServiceStub;
  let routerStub;

  beforeEach(async () => {
    element = await fixture(html`<login-form></login-form>`);
    authServiceStub = sinon.stub(authService);
    routerStub = sinon.stub(Router, 'go');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Rendering', () => {
    it('should render login form with required elements', async () => {
      // Given
      const h2 = element.shadowRoot.querySelector('h2');
      const form = element.shadowRoot.querySelector('lion-form');
      const usernameInput = element.shadowRoot.querySelector('lion-input[name="username"]');
      const passwordInput = element.shadowRoot.querySelector('lion-input[name="password"]');
      const submitButton = element.shadowRoot.querySelector('lion-button-submit');
      const switchButton = element.shadowRoot.querySelector('.switch-mode');

      // Then
      expect(h2).to.exist;
      expect(h2.textContent).to.equal('Login');
      expect(form).to.exist;
      expect(usernameInput).to.exist;
      expect(passwordInput).to.exist;
      expect(submitButton).to.exist;
      expect(switchButton).to.exist;
    });

    it('should show error message when error property is set', async () => {
      // Given
      element.error = 'Invalid credentials';

      // When
      await element.updateComplete;

      // Then
      const errorDiv = element.shadowRoot.querySelector('.error');
      expect(errorDiv).to.exist;
      expect(errorDiv.textContent).to.equal('Invalid credentials');
    });

    it('should show loading state when loading property is true', async () => {
      // Given
      element.loading = true;

      // When
      await element.updateComplete;

      // Then
      const loadingDiv = element.shadowRoot.querySelector('.loading');
      const submitButton = element.shadowRoot.querySelector('lion-button-submit');

      expect(loadingDiv).to.exist;
      expect(submitButton.disabled).to.be.true;
      expect(submitButton.textContent.trim()).to.equal('Logging in...');
    });
  });

  describe('Form Submission', () => {
    it('should handle successful login', async () => {
      // Given
      authServiceStub.login.resolves({ token: 'test-token', username: 'testuser' });
      authServiceStub.getUser.returns({ username: 'testuser' });

      // When
      const form = element.shadowRoot.querySelector('lion-form');
      const mockEvent = {
        target: {
          serializedValue: {
            username: 'testuser',
            password: 'password123'
          }
        }
      };

      const userAuthenticatedPromise = oneEvent(element, 'user-authenticated');
      await element.handleSubmit(mockEvent);

      // Then
      expect(authServiceStub.login).to.have.been.calledOnceWith({
        username: 'testuser',
        password: 'password123'
      });
      expect(routerStub).to.have.been.calledOnceWith('/orders');

      const userAuthenticatedEvent = await userAuthenticatedPromise;
      expect(userAuthenticatedEvent.detail.user).to.deep.equal({ username: 'testuser' });
    });

    it('should handle login failure', async () => {
      // Given
      authServiceStub.login.rejects({ body: { error: 'Invalid credentials' } });
      const mockEvent = {
        target: {
          serializedValue: {
            username: 'testuser',
            password: 'wrongpassword'
          }
        }
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(element.error).to.equal('Invalid credentials');
      expect(element.loading).to.be.false;
      expect(routerStub).to.not.have.been.called;
    });

    it('should validate required fields', async () => {
      // Given
      const mockEvent = {
        target: {
          serializedValue: {
            username: '',
            password: ''
          }
        }
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(element.error).to.equal('Please fill in all fields');
      expect(authServiceStub.login).to.not.have.been.called;
    });

    it('should set loading state during submission', async () => {
      // Given
      authServiceStub.login.returns(new Promise(resolve => setTimeout(resolve, 100)));
      const mockEvent = {
        target: {
          serializedValue: {
            username: 'testuser',
            password: 'password123'
          }
        }
      };

      // When
      const submitPromise = element.handleSubmit(mockEvent);

      // Then
      expect(element.loading).to.be.true;
      expect(element.error).to.equal('');

      await submitPromise;
      expect(element.loading).to.be.false;
    });
  });

  describe('Navigation', () => {
    it('should navigate to register page when switch button is clicked', async () => {
      // Given
      const switchButton = element.shadowRoot.querySelector('.switch-mode');

      // When
      switchButton.click();

      // Then
      expect(routerStub).to.have.been.calledOnceWith('/register');
    });
  });
});
