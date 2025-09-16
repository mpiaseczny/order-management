import 'event-source-polyfill';
import { authService } from './auth.js';

class NotificationService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Set();
  }

  subscribe(callback) {
    if (!this.eventSource) {
      this.connect();
    }

    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  connect() {
    if (this.eventSource) {
      return;
    }

    try {
      // Natywny EventSource nie obsługuje headers, stąd użycie polyfilla
      this.eventSource = new EventSourcePolyfill('http://localhost:8080/api/notifications/subscribe', {
        headers: authService.getAuthHeaders()
      });

      this.eventSource.onopen = () => {
        console.log('SSE connection opened');
      };

      this.eventSource.addEventListener('order-created', (event) => {
        try {
          const orderData = JSON.parse(event.data);
          this.notifyListeners('order-created', orderData);
        } catch (error) {
          console.error('Error parsing order-created event:', error);
        }
      });

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        this.notifyListeners('error', error);

        // Attempt to reconnect after a delay
        if (this.eventSource.readyState === EventSource.CLOSED) {
          setTimeout(() => {
            if (this.listeners.size > 0) {
              this.reconnect();
            }
          }, 5000);
        }
      };
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('SSE connection closed');
    }
  }

  reconnect() {
    this.disconnect();
    this.connect();
  }

  notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      try {
        callback({ type, data });
      } catch (error) {
        console.error('Error in SSE listener callback:', error);
      }
    });
  }
}

export const notificationService = new NotificationService();
