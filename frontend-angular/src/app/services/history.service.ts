import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // ← This is correct for same folder

export interface HistoryOperation {
  id?: number;
  username?: string;
  timestamp?: string;
  operation: string;
  operand1: string;
  operand2?: string;
  result: string;
  errorMessage?: string;
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly BASE = 'http://localhost:8080/api/v1/history'; // ← Make sure this is correct

  constructor(
    private http: HttpClient,
    private authService: AuthService, // ← This should work now
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
      });
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getHistory(): Observable<HistoryOperation[]> {
    return this.http.get<HistoryOperation[]>(this.BASE, {
      headers: this.getHeaders(),
    });
  }

  logOperation(operation: HistoryOperation): Observable<HistoryOperation> {
    return this.http.post<HistoryOperation>(this.BASE, operation, {
      headers: this.getHeaders(),
    });
  }
}
