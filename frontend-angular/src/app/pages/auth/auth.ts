import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]).{8,}$/;
const MOBILE_RE = /^[0-9]{10}$/;

function validateEmail(v: string): string {
  if (!v.trim()) return 'Email is required';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return '';
}

function validatePassword(v: string, strict = true): string {
  if (!v) return 'Password is required';
  if (v.length < 8) return 'Password must be at least 8 characters';
  if (strict && !PASSWORD_RE.test(v))
    return 'Password must contain at least one letter, one digit, and one special character';
  return '';
}

function validateName(v: string): string {
  if (!v.trim()) return 'Full name is required';
  if (v.trim().length < 2 || v.trim().length > 50)
    return 'Name must be between 2 and 50 characters';
  return '';
}

function validateMobile(v: string): string {
  if (!v.trim()) return 'Mobile number is required';
  if (!MOBILE_RE.test(v)) return 'Mobile number must be exactly 10 digits';
  return '';
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css'],
})
export class AuthComponent implements OnInit {
  activeTab: 'login' | 'signup' = 'login';

  // Login fields
  loginEmail = '';
  loginPassword = '';
  loginEmailError = '';
  loginPasswordError = '';
  loginServerError = '';

  // Signup fields
  signupName = '';
  signupEmail = '';
  signupPassword = '';
  signupMobile = '';
  signupNameError = '';
  signupEmailError = '';
  signupPasswordError = '';
  signupMobileError = '';
  signupServerError = '';
  signupSuccessMessage = '';

  popupVisible = false;
  popupText = '';
  emojiPieces: { emoji: string; x: number; y: number }[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.activeTab = params['tab'] === 'signup' ? 'signup' : 'login';
    });

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      this.authService.handleGoogleCallback(token);
      this.router.navigate(['/']);
    }
  }

  showTab(tab: 'login' | 'signup'): void {
    this.activeTab = tab;
    this.clearAllErrors();
    this.popupVisible = false;
    this.emojiPieces = [];
    if (tab === 'signup') {
      this.signupSuccessMessage = '';
    }
  }

  togglePassword(input: HTMLInputElement): void {
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  googleLogin(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  googleSignup(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  submitLogin(): void {
    console.log('submitLogin called', this.loginEmail, this.loginPassword);
    this.popupVisible = false;
    this.emojiPieces = [];
    this.loginEmailError = validateEmail(this.loginEmail);
    this.loginPasswordError = validatePassword(this.loginPassword, false);
    this.loginServerError = '';

    if (this.loginEmailError || this.loginPasswordError) return;

    this.isLoading = true;
    this.authService.login(this.loginEmail, this.loginPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.loginServerError = err.error?.message || 'Login failed. Please try again.';
      },
    });
  }

  submitSignup(): void {
    this.signupNameError = validateName(this.signupName);
    this.signupEmailError = validateEmail(this.signupEmail);
    this.signupPasswordError = validatePassword(this.signupPassword, true);
    this.signupMobileError = validateMobile(this.signupMobile);
    this.signupServerError = '';

    if (
      this.signupNameError ||
      this.signupEmailError ||
      this.signupPasswordError ||
      this.signupMobileError
    )
      return;

    this.isLoading = true;
    this.authService
      .register(this.signupName, this.signupEmail, this.signupPassword, this.signupMobile)
      .subscribe({
        next: (response) => {
          console.log('Signup success:', response);
          this.isLoading = false;
          this.signupName = '';
          this.signupEmail = '';
          this.signupPassword = '';
          this.signupMobile = '';
          this.signupSuccessMessage = 'user registered successfully';
        },
        error: (err: HttpErrorResponse | any) => {
          console.error('Signup error:', err);
          this.isLoading = false;
          let errorMessage = 'Registration failed. Please try again.';
          if (err.name === 'TimeoutError' || (err.status === 0 && !err.ok)) {
            errorMessage = 'Registration request timed out. Please try again.';
          } else if (err.status === 400 && err.error) {
            const e = err.error;
            if (e.name || e.email || e.password || e.mobile) {
              errorMessage = 'Please check the form fields for errors.';
              if (e.name) this.signupNameError = e.name;
              if (e.email) this.signupEmailError = e.email;
              if (e.password) this.signupPasswordError = e.password;
              if (e.mobile) this.signupMobileError = e.mobile;
            } else {
              errorMessage = err.error?.message || errorMessage;
            }
          } else {
            errorMessage = err.error?.message || errorMessage;
          }
          this.showPopup(errorMessage);
        },
      });
  }

  showPopup(message: string): void {
    this.isLoading = false;
    this.popupText = message;
    this.popupVisible = true;
    this.emojiPieces = this.createEmojiBurst();
  }

  closePopup(): void {
    this.popupVisible = false;
    this.emojiPieces = [];
    if (this.popupText.includes('logged')) {
      this.router.navigate(['/']);
    }
  }

  private clearAllErrors(): void {
    this.loginEmailError = '';
    this.loginPasswordError = '';
    this.loginServerError = '';
    this.signupNameError = '';
    this.signupEmailError = '';
    this.signupPasswordError = '';
    this.signupMobileError = '';
    this.signupServerError = '';
    this.signupSuccessMessage = '';
  }

  private createEmojiBurst(): { emoji: string; x: number; y: number }[] {
    const pieces: { emoji: string; x: number; y: number }[] = [];
    const symbols = ['🎉', '✨', '🎊', '💥', '🌟', '🎈'];
    const total = 18;
    for (let i = 0; i < total; i += 1) {
      const angle = (Math.PI * 2 * i) / total;
      const distance = 90 + Math.random() * 180;
      pieces.push({
        emoji: symbols[i % symbols.length],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      });
    }
    return pieces;
  }
}
