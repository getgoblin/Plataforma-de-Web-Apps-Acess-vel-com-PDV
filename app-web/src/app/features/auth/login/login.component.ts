import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private readonly userSvc = inject(UserService);
  private readonly router = inject(Router);

  name = '';
  pw = '';
  fading = false;
  formSuccess = false;
  userReadonly = true;
  pwReadonly = true;

  submit() {
    const n = this.name?.trim();
    if (!n) return;

    // animação: fade do form e “empurrar” título
    this.fading = true;
    setTimeout(() => {
      this.formSuccess = true;
      this.userSvc.login(n);
      this.router.navigate(['/app']);
    }, 500); // mesmo tempo do CSS (.5s)
  }
}
