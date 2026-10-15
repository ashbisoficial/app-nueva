import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registrarIconos } from './app/core/icons';

registerLocaleData(localeEs);
registrarIconos();

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
