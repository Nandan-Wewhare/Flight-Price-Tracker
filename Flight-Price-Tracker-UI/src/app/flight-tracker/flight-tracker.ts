import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface FlightTracking {
  id: string;
  userEmail: string;
  origin: string;
  destination: string;
  departureDate: Date;
  targetPrice: number | null;
  actualPrice: number;
  notificationSent: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-flight-tracker',
  templateUrl: './flight-tracker.html',
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class FlightTrackerComponent implements OnInit {
  trackings: FlightTracking[] = [];
  loading = false;
  adding = false;
  error = '';
  newTracking: FlightTracking = {
    id: '',
    userEmail: '',
    origin: '',
    destination: '',
    departureDate: new Date(),
    targetPrice: null,
    actualPrice: 0,
    notificationSent: false,
    createdAt: new Date()
  };
  apiHost = 'https://price-tracker-api-dbhrbxcfdsbtfmaj.eastus2-01.azurewebsites.net/api';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchTrackings();
  }

  fetchTrackings() {
    this.loading = true;
    this.http.get<FlightTracking[]>(`${this.apiHost}/Tracking`).subscribe({
      next: (data) => {
        this.trackings = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading trackings';
        this.loading = false;
      }
    });
  }

  addTracking() {
    this.adding = true;
    this.http.post<FlightTracking>(`${this.apiHost}/Tracking`, this.newTracking).subscribe({
      next: (tracking) => {
        this.trackings.push(tracking);
        this.error = '';
        this.adding = false;
        // Reset form  
        this.newTracking = {
          id: '',
          userEmail: '',
          origin: '',
          destination: '',
          departureDate: new Date(),
          targetPrice: null,
          actualPrice: 0,
          notificationSent: false,
          createdAt: new Date()
        };
      },
      error: () => {
        this.error = 'Error adding tracking';
        this.adding = false;
      }
    });
  }
}  