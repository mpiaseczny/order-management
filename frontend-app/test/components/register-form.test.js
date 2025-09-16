import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/components/register-form.js';
import { authService } from '../../src/services/auth.js';
import { Router } from '@vaadin/router';

describe('RegisterForm', () => {
  let element;
  let authServiceStub;
  let routerStub;

  beforeEach(async () => {
    element = await fixture(html`<register-form></register-form>`);
    authServiceStub = sinon.stub(authService);
    routerStub = sinon.stub(Router, 'go');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Rendering', () => {
    it('should render register form with required elements', async () => {
      const h2 = element.shadowRoot.querySelector('h2');
      const form = element.shadowRoot.querySelector('lion-form');
      const usernameInput = element.shadowRoot.querySelector('lion-input[name="username"]');
      const passwordInput = element.shadowRoot.querySelector('lion-input[name="password"]');
      const submitButton = element.shadowRoot.querySelector('lion-button-submit');
      const switchButton = element.shadowRoot.querySelector('.switch-mode');

      expect(h2).to.exist;
      expect(h2.textContent).to.equal('Register');
      expect(form).to.exist;
      expect(usernameInput).to.exist;
      expect(passwordInput).to.exist;
      expect(submitButton).to.exist;
      expect(switchButton).to.exist;
    });

    it('should show error message when error property is set', async () => {
      // Given
      element.error = 'Username already exists';

      // When
      await element.updateComplete;

      // Then
      const errorDiv = element.shadowRoot.querySelector('.error');
      expect(errorDiv).to.exist;
      expect(errorDiv.textContent).to.equal('Username already exists');
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
      expect(submitButton.textContent.trim()).to.equal('Creating Account...');
    });
  });

  describe('Form Validation', () => {
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
      expect(authServiceStub.register).to.not.have.been.called;
    });

    it('should validate username minimum length', async () => {
      // Given
      const mockEvent = {
        target: {
          serializedValue: {
            username: 'ab',
            password: 'password123'
          }
        }
      };


      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(element.error).to.equal('Username must be at least 3 characters long');
      expect(authServiceStub.register).to.not.have.been.called;
    });

    it('should validate password minimum length', async () => {
      // Given
      const mockEvent = {
        target: {
          serializedValue: {
            username: 'testuser',
            password: '12345'
          }
        }
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(element.error).to.equal('Password must be at least 6 characters long');
      expect(authServiceStub.register).to.not.have.been.called;
    });
  });

  describe('Form Submission', () => {
    it('should handle successful registration', async () => {
      // Given
      authServiceStub.register.resolves({ token: 'test-token', username: 'testuser' });
      const mockEvent = {
        target: {
          serializedValue: {
            username: 'testuser',
            password: 'password123'
          }
        }
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(authServiceStub.register).to.have.been.calledOnceWith({
        username: 'testuser',
        password: 'password123'
      });
      expect(routerStub).to.have.been.calledOnceWith('/orders');
      expect(element.loading).to.be.false;
    });

    it('should handle registration failure', async () => {
      // Given
      authServiceStub.register.rejects(new Error('Username already exists'));
      const mockEvent = {
        target: {
          serializedValue: {
            username: 'existinguser',
            password: 'password123'
          }
        }
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(element.error).to.equal('Username already exists');
      expect(element.loading).to.be.false;
      expect(routerStub).to.not.have.been.called;
    });

    it('should trim username before submission', async () => {
      // Given
      authServiceStub.register.resolves({ token: 'test-token', username: 'testuser' });
      const mockEvent = {
        target: {
          serializedValue: {
            username: '  testuser  ',
            password: 'password123'
          }
        }
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(authServiceStub.register).to.have.been.calledOnceWith({
        username: 'testuser',
        password: 'password123'
      });
    });

    it('should set loading state during submission', async () => {
      // Given
      authServiceStub.register.returns(new Promise(resolve => setTimeout(resolve, 100)));
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
    it('should navigate to login page when switch button is clicked', async () => {
      // Given
      const switchButton = element.shadowRoot.querySelector('.switch-mode');

      // When
      switchButton.click();

      // Then
      expect(routerStub).to.have.been.calledOnceWith('/login');
    });
  });
});
