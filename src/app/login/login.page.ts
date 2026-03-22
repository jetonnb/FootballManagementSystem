import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NavController, ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  loginForm: FormGroup;
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async login() {
    if (this.loginForm.invalid) {
      this.showToast('Ju lutem plotësoni të gjitha fushat saktë.');
      return;
    }

    const { username, password } = this.loginForm.value;
    const emailToAuth = `${username.toLowerCase().trim()}@roma.com`;

    const loading = await this.loadingCtrl.create({
      message: 'Duke u lidhur...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.authService.login(emailToAuth, password);
      await loading.dismiss();
      this.navCtrl.navigateRoot('/dashboard');
    } catch (error: any) {
      await loading.dismiss();
      this.showToast('Gabim gjatë lidhjes: Pseudonimi ose fjalëkalimi është i gabuar.');
    }
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
