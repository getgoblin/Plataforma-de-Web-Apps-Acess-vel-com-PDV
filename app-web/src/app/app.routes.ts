import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { ShellLayoutComponent } from './features/shell/shell-layout/shell-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent, title: 'Login'},

    //Área Principal (LayoutBase) - protegida pelo guard
    {path: 'app', component: ShellLayoutComponent, canMatch: [authGuard], title: 'Aplicação'},

    //Redirecionamentos
    {path: '', pathMatch: 'full', redirectTo: 'login'},
    {path: '**', redirectTo: 'app'}
];
