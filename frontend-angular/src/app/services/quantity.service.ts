import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuantityDTO {
  value: number;
  unit: string;
}

export interface QuantityInputDTO {
  thisQuantityDTO: QuantityDTO;
  thatQuantityDTO: QuantityDTO;
}

@Injectable({ providedIn: 'root' })
export class QuantityService {
  private readonly BASE = 'http://localhost:8080/api/v1/quantities';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  compare(input: QuantityInputDTO): Observable<boolean> {
    return this.http.post<boolean>(`${this.BASE}/operations/compare`, input, {
      headers: this.getHeaders(),
    });
  }

  convert(input: QuantityDTO, targetUnit: string): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(
      `${this.BASE}/operations/convert/${encodeURIComponent(targetUnit)}`,
      input,
      {
        headers: this.getHeaders(),
      },
    );
  }

  add(input: QuantityInputDTO): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(`${this.BASE}/operations/add`, input, {
      headers: this.getHeaders(),
    });
  }

  subtract(input: QuantityInputDTO): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(`${this.BASE}/operations/subtract`, input, {
      headers: this.getHeaders(),
    });
  }

  divide(input: QuantityInputDTO): Observable<number> {
    return this.http.post<number>(`${this.BASE}/operations/divide`, input, {
      headers: this.getHeaders(),
    });
  }
}
