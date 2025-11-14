import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AuthApiService } from '../../../core/api/auth-api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  // === deps ===
  private readonly userSvc = inject(UserService);
  private readonly authApi = inject(AuthApiService);
  private readonly router  = inject(Router);

  // === state ===
  name = '';
  pw = '';
  fading = false;
  formSuccess = false;
  userReadonly = true;
  pwReadonly = true;

  // === actions ===
  async submit() {
    const n = this.name?.trim();
    if (!n) return;

    // --- feedback visual (fade + desloca tÃ­tulo) ---
    this.fading = true;
    try{
      if (this.pw?.trim()) {
        const resp = await this.authApi.login(n, this.pw.trim());
        this.userSvc.login(resp?.user?.name || resp?.user?.email || n);
      } else {
        this.userSvc.login(n);
      }
      setTimeout(() => { this.formSuccess = true; this.router.navigate(['/app']); }, 500);
    } catch {
      this.fading = false;
      alert('Falha no login. Verifique usuário/senha ou o servidor.');
    }
  }
}

