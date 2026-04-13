import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HistoryService, HistoryOperation } from '../../services/history.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './history.html',
  styleUrls: ['./history.css'],
})
export class HistoryComponent implements OnInit {
  history: HistoryOperation[] = [];
  isLoading = true;
  showLogoutDialog = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private historyService: HistoryService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth'], { queryParams: { tab: 'login' } });
      return;
    }
    this.fetchHistory();
  }

  fetchHistory(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.historyService.getHistory().subscribe({
      next: (data) => {
        this.history = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load history', err);
        if (err.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
        } else {
          this.errorMessage = 'Failed to load history. Please try again.';
        }
        this.isLoading = false;
      },
    });
  }

  showLogoutConfirm(): void {
    this.showLogoutDialog = true;
  }

  confirmLogout(): void {
    this.authService.logout();
    this.showLogoutDialog = false;
    this.router.navigate(['/']);
  }

  cancelLogout(): void {
    this.showLogoutDialog = false;
  }

  formatTime(timestamp?: string): string {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }

  getOpClass(op: string): string {
    switch (op.toUpperCase()) {
      case 'CONVERSION':
        return 'op-conversion';
      case 'COMPARISON':
        return 'op-comparison';
      case 'ADD':
        return 'op-add';
      case 'SUBTRACT':
        return 'op-subtract';
      case 'MULTIPLY':
        return 'op-multiply';
      case 'DIVIDE':
        return 'op-divide';
      default:
        return 'op-conversion';
    }
  }
}
