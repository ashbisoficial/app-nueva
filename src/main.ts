import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registrarIconos } from './app/core/icons';

registrarIconos();

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
