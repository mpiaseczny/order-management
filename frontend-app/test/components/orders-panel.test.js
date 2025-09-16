import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/components/orders-panel.js';
import { apiService } from '../../src/services/api.js';
import { notificationService } from '../../src/services/kafka.js';

describe('OrdersPanel', () => {
  let element;
  let apiServiceStub;
  let updateOrderStatusStub;
  let notificationServiceStub;

  const mockOrders = [
    {
      id: 1,
      customerId: 123,
      description: 'Test order 1',
      status: 'PENDING',
      createdAt: '2023-01-01T10:00:00Z'
    },
    {
      id: 2,
      customerId: 456,
      description: 'Test order 2',
      status: 'CONFIRMED',
      createdAt: '2023-01-02T11:00:00Z'
    }
  ];

  beforeEach(async () => {
    apiServiceStub = {
      getOrders: sinon.stub().resolves(mockOrders),
      updateOrderStatus: sinon.stub().resolves()
    };
    sinon.stub(apiService, 'getOrders').callsFake(apiServiceStub.getOrders);
    sinon.stub(apiService, 'updateOrderStatus').callsFake(apiServiceStub.updateOrderStatus);
    notificationServiceStub = sinon.stub(notificationService, 'subscribe').returns(() => {});

    element = await fixture(html`<orders-panel></orders-panel>`);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Rendering', () => {
    it('should render orders panel with required elements', async () => {
      // When
      await element.updateComplete;

      // Then
      const h3 = element.shadowRoot.querySelector('h3');
      const refreshBtn = element.shadowRoot.querySelector('.refresh-btn');
      const checkbox = element.shadowRoot.querySelector('lion-checkbox');
      const table = element.shadowRoot.querySelector('table');

      expect(h3).to.exist;
      expect(h3.textContent.trim()).to.include('Orders');
      expect(refreshBtn).to.exist;
      expect(checkbox).to.exist;
      expect(table).to.exist;
    });

    it('should show loading state when loading', async () => {
      // Given
      element.loading = true;

      // When
      await element.updateComplete;

      // Then
      const loadingDiv = element.shadowRoot.querySelector('.loading');
      const refreshBtn = element.shadowRoot.querySelector('.refresh-btn');

      expect(loadingDiv).to.exist;
      expect(loadingDiv.textContent).to.equal('Loading orders...');
      expect(refreshBtn.disabled).to.be.true;
      expect(refreshBtn.textContent.trim()).to.equal('Loading...');
    });

    it('should show empty state when there are no orders', async () => {
      // Given
      apiServiceStub.getOrders.resolves([]);
      element.orders = [];
      element.loading = false;

      // When
      await element.updateComplete;

      // Then
      const emptyDiv = element.shadowRoot.querySelector('.empty');
      expect(emptyDiv).to.exist;
      expect(emptyDiv.textContent).to.equal('No orders found. Create your first order above!');
    });

    it('should show error message when error occurs', async () => {
      // Given
      element.error = 'Failed to load orders';

      // When
      await element.updateComplete;

      // Then
      const errorDiv = element.shadowRoot.querySelector('.error');
      expect(errorDiv).to.exist;
      expect(errorDiv.textContent).to.equal('Failed to load orders');
    });
  });

  describe('Data Loading', () => {
    it('should load orders on component initialization', async () => {
      // Then
      expect(apiServiceStub.getOrders).to.have.been.calledOnce;
      expect(element.orders).to.deep.equal(mockOrders);
    });

    it('should load active orders only when activeOnly is true', async () => {
      // Given
      element.activeOnly = true;

      // When
      await element.loadOrders();

      // Then
      expect(apiServiceStub.getOrders).to.have.been.calledWith(true);
    });

    it('should handle loading errors gracefully', async () => {
      // Given
      const errorMessage = 'Network error';
      apiServiceStub.getOrders.rejects(new Error(errorMessage));

      // When
      await element.loadOrders();

      // Then
      expect(element.error).to.equal(errorMessage);
      expect(element.loading).to.be.false;
    });

    it('should refresh orders when refresh button is clicked', async () => {
      // Given
      apiServiceStub.getOrders.resetHistory();
      const refreshBtn = element.shadowRoot.querySelector('.refresh-btn');

      // When
      refreshBtn.click();
      await element.updateComplete;

      // Then
      expect(apiServiceStub.getOrders).to.have.been.calledOnce;
    });
  });

  describe('Status Updates', () => {
    it('should update order status when status is changed', async () => {
      // Given
      apiServiceStub.updateOrderStatus.resolves();
      apiServiceStub.getOrders.resetHistory();
      await element.updateComplete;

      // When
      await element.handleStatusChange(1, 'CONFIRMED');

      // Then
      expect(apiServiceStub.updateOrderStatus).to.have.been.calledOnceWith(1, 'CONFIRMED');
      expect(apiServiceStub.getOrders).to.have.been.calledOnce;
    });

    it('should handle status update errors', async () => {
      // Given
      const errorMessage = 'Update failed';
      apiServiceStub.updateOrderStatus.rejects(new Error(errorMessage));

      // When
      await element.handleStatusChange(1, 'CONFIRMED');

      // Then
      expect(element.error).to.equal(`Failed to update order status: ${errorMessage}`);
    });
  });

  describe('Filtering', () => {
    it('should toggle activeOnly filter when checkbox is changed', async () => {
      // Given
      apiServiceStub.getOrders.resetHistory();
      const checkbox = element.shadowRoot.querySelector('lion-checkbox');

      // When
      const mockEvent = { target: { checked: true } };
      element.handleActiveOnlyChange(mockEvent);

      // Then
      expect(element.activeOnly).to.be.true;
      expect(apiServiceStub.getOrders).to.have.been.calledWith(true);
    });
  });

  describe('Date Formatting', () => {
    it('should format date strings correctly', () => {
      // Given
      const dateString = '2023-01-01T10:00:00Z';

      // When
      const formattedDate = element.formatDate(dateString);

      // Then
      expect(formattedDate).to.equal(new Date(dateString).toLocaleString());
    });

    it('should handle empty date strings', () => {
      // When
      const formattedDate = element.formatDate('');

      // Then
      expect(formattedDate).to.equal('');
    });

    it('should handle null date values', () => {
      // When
      const formattedDate = element.formatDate(null);

      // Then
      expect(formattedDate).to.equal('');
    });
  });

  describe('Real-time Notifications', () => {
    it('should subscribe to notifications on connect', async () => {
      // Then
      expect(notificationServiceStub).to.have.been.calledOnce;
    });

    it('should handle order-created notifications', async () => {
      // Given
      const mockCallback = notificationServiceStub.firstCall.args[0];
      apiServiceStub.getOrders.resetHistory();

      const mockNotification = { className: '', textContent: '', parentNode: null };
      sinon.stub(document, 'createElement').returns(mockNotification);
      sinon.stub(element.shadowRoot, 'insertBefore');

      // When
      mockCallback({ type: 'order-created', data: { id: 3 } });
      await element.updateComplete;

      // Then
      expect(document.createElement).to.have.been.calledWith('div');
      expect(mockNotification.className).to.equal('notification');
      expect(mockNotification.textContent).to.equal('New order created!');
      expect(apiServiceStub.getOrders).to.have.been.calledOnce;
    });

    it('should unsubscribe from notifications on disconnect', async () => {
      // Given
      const mockUnsubscribe = sinon.stub();
      element.notificationUnsubscribe = mockUnsubscribe;

      // When
      element.disconnectedCallback();

      // Then
      expect(mockUnsubscribe).to.have.been.calledOnce;
    });
  });
});
