import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/components/order-form.js';
import { apiService } from '../../src/services/api.js';

describe('OrderForm', () => {
  let element;
  let apiServiceStub;

  beforeEach(async () => {
    element = await fixture(html`<order-form></order-form>`);
    apiServiceStub = sinon.stub(apiService, 'createOrder');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Rendering', () => {
    it('should render order form with required elements', async () => {
      const h3 = element.shadowRoot.querySelector('h3');
      const form = element.shadowRoot.querySelector('lion-form');
      const customerIdInput = element.shadowRoot.querySelector('lion-input[name="customerId"]');
      const descriptionInput = element.shadowRoot.querySelector('lion-input[name="description"]');
      const submitButton = element.shadowRoot.querySelector('lion-button-submit');

      expect(h3).to.exist;
      expect(h3.textContent).to.equal('Create New Order');
      expect(form).to.exist;
      expect(customerIdInput).to.exist;
      expect(customerIdInput.getAttribute('type')).to.equal('number');
      expect(descriptionInput).to.exist;
      expect(submitButton).to.exist;
    });

    it('should show error message when error property is set', async () => {
      // Given
      element.error = 'Invalid customer ID';

      // When
      await element.updateComplete;

      // Then
      const errorDiv = element.shadowRoot.querySelector('.error');
      expect(errorDiv).to.exist;
      expect(errorDiv.textContent).to.equal('Invalid customer ID');
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
      expect(submitButton.textContent.trim()).to.equal('Creating Order...');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      // Given
      const mockEvent = {
        target: {
          serializedValue: {
            customerId: '',
            description: ''
          }
        }
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(element.error).to.equal('Please fill in all fields');
      expect(apiServiceStub).to.not.have.been.called;
    });

    it('should validate customer ID is a number', async () => {
      // Given
      const mockEvent = {
        target: {
          serializedValue: {
            customerId: 'abc',
            description: 'Test order'
          }
        }
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(element.error).to.equal('Customer ID must be a non-negative number');
      expect(apiServiceStub).to.not.have.been.called;
    });

    it('should validate customer ID is non-negative', async () => {
      // Given
      const mockEvent = {
        target: {
          serializedValue: {
            customerId: '-1',
            description: 'Test order'
          }
        }
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(element.error).to.equal('Customer ID must be a non-negative number');
      expect(apiServiceStub).to.not.have.been.called;
    });
  });

  describe('Form Submission', () => {
    it('should handle successful order creation', async () => {
      // Given:
      apiServiceStub.resolves({ id: 1, customerId: 123, description: 'Test order' });
      const mockForm = {
        resetGroup: sinon.stub(),
        serializedValue: {
          customerId: '123',
          description: 'Test order'
        }
      };

      const mockEvent = {
        target: mockForm
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(apiServiceStub).to.have.been.calledOnceWith({
        customerId: 123,
        description: 'Test order'
      });
      expect(mockForm.resetGroup).to.have.been.called;
      expect(element.loading).to.be.false;
      expect(element.error).to.equal('');
    });

    it('should handle order creation failure', async () => {
      // Given
      apiServiceStub.rejects(new Error('Failed to create order'));
      const mockEvent = {
        target: {
          serializedValue: {
            customerId: '123',
            description: 'Test order'
          }
        }
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(element.error).to.equal('Failed to create order');
      expect(element.loading).to.be.false;
    });

    it('should convert customer ID to number', async () => {
      // Given
      apiServiceStub.resolves({ id: 1 });
      const mockForm = {
        resetGroup: sinon.stub(),
        serializedValue: {
          customerId: '123',
          description: 'Test order'
        }
      };

      const mockEvent = {
        target: mockForm
      };

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(apiServiceStub).to.have.been.calledOnceWith({
        customerId: 123,
        description: 'Test order'
      });
    });

    it('should set loading state during submission', async () => {
      // Given
      apiServiceStub.returns(new Promise(resolve => setTimeout(resolve, 100)));
      const mockEvent = {
        target: {
          resetGroup: sinon.stub(),
          serializedValue: {
            customerId: '123',
            description: 'Test order'
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

    it('should show success message after successful creation', async () => {
      // Given
      apiServiceStub.resolves({ id: 1 });
      const mockForm = {
        resetGroup: sinon.stub(),
        serializedValue: {
          customerId: '123',
          description: 'Test order'
        }
      };

      const mockEvent = {
        target: mockForm
      };

      const mockSuccessDiv = { className: '', textContent: '', parentNode: null };
      const mockLionForm = { parentNode: { insertBefore: sinon.stub() } };
      sinon.stub(element.shadowRoot, 'querySelector').returns(mockLionForm);
      sinon.stub(document, 'createElement').returns(mockSuccessDiv);

      // When
      await element.handleSubmit(mockEvent);

      // Then
      expect(document.createElement).to.have.been.calledWith('div');
      expect(mockSuccessDiv.className).to.equal('success');
      expect(mockSuccessDiv.textContent).to.equal('Order created successfully!');
      expect(mockLionForm.parentNode.insertBefore).to.have.been.calledWith(mockSuccessDiv, mockLionForm);
    });
  });
});
