import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

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

  airports: Airport[] = [
    { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
    { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
    { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
    { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
    { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
    { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
    { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
    { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan' },
    { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
    { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea' },
    { code: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China' },
    { code: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China' },
    { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong' },
    { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
    { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia' },
    { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada' },
    { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada' },
    { code: 'GRU', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'Brazil' },
    { code: 'EZE', name: 'Ezeiza International Airport', city: 'Buenos Aires', country: 'Argentina' },
    { code: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa' },
    { code: 'JNB', name: 'O.R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa' },
    { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt' },
    { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
    { code: 'SVO', name: 'Sheremetyevo International Airport', city: 'Moscow', country: 'Russia' },
    { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India' },
    { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India' },
    { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bangalore', country: 'India' },
    { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India' },
    { code: 'CCU', name: 'Netaji Subhas Chandra Bose International Airport', city: 'Kolkata', country: 'India' },
    { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India' },
    { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', country: 'India' },
    { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India' },
    { code: 'GOI', name: 'Goa Airport', city: 'Goa', country: 'India' },
    { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India' }
  ];

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
    // Validate that origin and destination are different
    if (this.newTracking.origin === this.newTracking.destination) {
      this.error = 'Origin and destination must be different';
      return;
    }

    // Validate that origin and destination are selected
    if (!this.newTracking.origin || !this.newTracking.destination) {
      this.error = 'Please select both origin and destination airports';
      return;
    }

    this.adding = true;
    this.error = '';
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

  getAvailableDestinations(): Airport[] {
    return this.airports.filter(airport => airport.code !== this.newTracking.origin);
  }

  getAvailableOrigins(): Airport[] {
    return this.airports.filter(airport => airport.code !== this.newTracking.destination);
  }

  onOriginChange() {
    // If destination is the same as new origin, clear destination
    if (this.newTracking.destination === this.newTracking.origin) {
      this.newTracking.destination = '';
    }
    this.error = '';
  }

  onDestinationChange() {
    // If origin is the same as new destination, clear origin
    if (this.newTracking.origin === this.newTracking.destination) {
      this.newTracking.origin = '';
    }
    this.error = '';
  }
}  