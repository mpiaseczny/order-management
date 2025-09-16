import { Router } from '@vaadin/router';
import './components/main-layout.js';
import './pages/login-page.js';
import './pages/register-page.js';
import './pages/orders-page.js';

function authGuard(context, commands) {
  const user = JSON.parse(localStorage.getItem('user'));
  const publicPaths = ['/login', '/register'];

  if (!user && !publicPaths.includes(context.pathname)) {
    return commands.redirect('/login');
  }

  if (user && publicPaths.includes(context.pathname)) {
    return commands.redirect('/orders');
  }

  return undefined;
}

const outlet = document.getElementById('app');
window.router = new Router(outlet);

window.router.setRoutes([
  { path: '/', redirect: '/login' },
  {
    path: '/',
    component: 'main-layout',
    action: authGuard,
    children: [
      { path: 'login', component: 'login-page' },
      { path: 'register', component: 'register-page' },
      { path: 'orders', component: 'orders-page' },
    ]
  }
]);
