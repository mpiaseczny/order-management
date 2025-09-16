import { html } from 'lit';
import { fixture, expect, oneEvent } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/components/main-layout.js';
import { authService } from '../../src/services/auth.js';
import { Router } from '@vaadin/router';

describe('MainLayout', () => {
  let element;
  let authServiceStub;
  let routerStub;
  let localStorageStub;

  beforeEach(async () => {
    localStorageStub = {
      getItem: sinon.stub(),
      setItem: sinon.stub(),
      removeItem: sinon.stub()
    };
    sinon.stub(window, 'localStorage').value(localStorageStub);

    authServiceStub = sinon.stub(authService);
    routerStub = sinon.stub(Router, 'go');

    localStorageStub.getItem.withArgs('user').returns(null);

    element = await fixture(html`<main-layout></main-layout>`);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Rendering', () => {
    it('should not show user info when not authenticated', async () => {
      // Given
      element.isAuthenticated = false;

      // When
      await element.updateComplete;

      // Then
      const userSpan = element.shadowRoot.querySelector('span');
      const logoutBtn = element.shadowRoot.querySelector('.logout-btn');

      expect(userSpan).to.not.exist;
      expect(logoutBtn).to.not.exist;
    });

    it('should show user info and logout button when authenticated', async () => {
      // Given
      element.user = { username: 'testuser' };
      element.isAuthenticated = true;

      // When
      await element.updateComplete;

      // Then
      const userSpan = element.shadowRoot.querySelector('span');
      const logoutBtn = element.shadowRoot.querySelector('.logout-btn');

      expect(userSpan).to.exist;
      expect(userSpan.textContent).to.equal('Welcome, testuser');
      expect(logoutBtn).to.exist;
      expect(logoutBtn.textContent).to.equal('Logout');
    });
  });

  describe('Authentication State', () => {
    it('should initialize with user from localStorage', async () => {
      // Given
      const userData = { username: 'testuser' };
      localStorageStub.getItem.withArgs('user').returns(JSON.stringify(userData));

      // When
      const newElement = await fixture(html`<main-layout></main-layout>`);

      // Then
      expect(newElement.user).to.deep.equal(userData);
      expect(newElement.isAuthenticated).to.be.true;
    });

    it('should initialize without user when localStorage is empty', async () => {
      // Given
      localStorageStub.getItem.withArgs('user').returns(null);

      // When
      const newElement = await fixture(html`<main-layout></main-layout>`);

      // Then
      expect(newElement.user).to.be.null;
      expect(newElement.isAuthenticated).to.be.false;
    });

    it('should handle user authenticated event', async () => {
      // Given
      const userData = { username: 'testuser' };
      const loginEvent = new CustomEvent('user-authenticated', {
        detail: { user: userData },
        bubbles: true,
        composed: true
      });

      // When
      element.dispatchEvent(loginEvent);
      await element.updateComplete;

      // Then
      expect(element.user).to.deep.equal(userData);
      expect(element.isAuthenticated).to.be.true;
    });
  });

  describe('Logout Functionality', () => {
    it('should handle logout when logout button is clicked', async () => {
      // Given
      element.user = { username: 'testuser' };
      element.isAuthenticated = true;

      // When
      await element.updateComplete;
      const logoutBtn = element.shadowRoot.querySelector('.logout-btn');
      logoutBtn.click();

      // Then
      expect(authServiceStub.logout).to.have.been.calledOnce;
      expect(element.user).to.be.null;
      expect(element.isAuthenticated).to.be.false;
      expect(routerStub).to.have.been.calledOnceWith('/login');
    });

    it('should clear user state on logout', async () => {
      // Given
      element.user = { username: 'testuser' };
      element.isAuthenticated = true;

      // When
      element.handleLogout();

      // Then
      expect(element.user).to.be.null;
      expect(element.isAuthenticated).to.be.false;
    });
  });
});
