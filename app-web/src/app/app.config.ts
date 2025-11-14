import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/api/auth.interceptor';
import { API_BASE_URL } from './core/api/api.tokens';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: API_BASE_URL, useValue: 'http://localhost:4000' },
    provideRouter(
      routes, 
      withHashLocation(),
      withInMemoryScrolling({
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled'
    })
  )]
};
