import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth'; 
import { HomeComponent } from './pages/home/home'; 
import { HistoryComponent } from './pages/history/history'; 
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'history', component: HistoryComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
