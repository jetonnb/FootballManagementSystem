import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { BookingService, Booking } from '../services/booking.service';
import { BookingModalComponent } from '../components/booking-modal/booking-modal.component';
import { Subscription } from 'rxjs';

interface TimeSlot {
  timeStr: string; 
  startHour: string; 
  booking?: Booking;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit, OnDestroy {
  selectedDate: string;
  selectedCourt: number = 1;
  isLoading = true;
  currentSlots: TimeSlot[] = [];
  displayMonth!: number;
  displayYear!: number;
  calendarDays: any[] = [];
  private bookingSub?: Subscription;

  private authService = inject(AuthService);
  private bookingService = inject(BookingService);
  private navCtrl = inject(NavController);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);

  constructor() {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
  }

  get formattedDateAlbanian(): string {
    if (!this.selectedDate) return '';
    const dateObj = new Date(this.selectedDate);
    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    const months = ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor"];
    const ditaJaves = dateObj.getDay(); 
    const days = ["E Diel", "E Hënë", "E Martë", "E Mërkurë", "E Enjte", "E Premte", "E Shtunë"];
    
    return `${days[ditaJaves]}, ${day} ${months[month]} ${year}`;
  }

  ngOnInit() {
    this.initCalendar();
    this.loadBookings();
  }

  initCalendar() {
    const d = new Date(this.selectedDate);
    this.displayMonth = d.getMonth();
    this.displayYear = d.getFullYear();
    this.generateCalendarGrid();
  }

  get currentMonthName(): string {
    const months = ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor"];
    return months[this.displayMonth];
  }

  prevMonth() {
    if (this.displayMonth === 0) {
      this.displayMonth = 11;
      this.displayYear--;
    } else {
      this.displayMonth--;
    }
    this.generateCalendarGrid();
  }

  nextMonth() {
    if (this.displayMonth === 11) {
      this.displayMonth = 0;
      this.displayYear++;
    } else {
      this.displayMonth++;
    }
    this.generateCalendarGrid();
  }

  generateCalendarGrid() {
    this.calendarDays = [];
    const firstDay = new Date(this.displayYear, this.displayMonth, 1).getDay();
    let startingEmptySlots = firstDay === 0 ? 6 : firstDay - 1;
    
    for (let i = 0; i < startingEmptySlots; i++) {
        this.calendarDays.push(null);
    }
    
    const daysInMonth = new Date(this.displayYear, this.displayMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const fullDate = `${this.displayYear}-${(this.displayMonth + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        this.calendarDays.push({ date: i, fullDate });
    }
  }

  selectDate(fullDate: string) {
    this.selectedDate = fullDate;
    this.modalCtrl.dismiss(null, 'cancel', 'custom-calendar-modal');
    this.loadBookings();
  }

  closeCalendarModal() {
    this.modalCtrl.dismiss(null, 'cancel', 'custom-calendar-modal');
  }

  ngOnDestroy() {
    this.unsubscribeBookings();
  }

  unsubscribeBookings() {
    if (this.bookingSub) {
      this.bookingSub.unsubscribe();
      this.bookingSub = undefined;
    }
  }

  generateSlots(bookings: Booking[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const hours = [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 
      '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', 
      '00:00', '01:00', '02:00'
    ];

    for (let i = 0; i < hours.length; i++) {
      const startHour = hours[i];
      let endHourStr = '';
      if (i < hours.length - 1) {
        endHourStr = hours[i + 1];
      } else {
        endHourStr = '03:00';
      }
      
      const timeStr = `${startHour} - ${endHourStr}`;
      const booking = bookings.find(b => b.oraFillimit === startHour);
      
      slots.push({
        timeStr,
        startHour,
        booking
      });
    }

    return slots;
  }

  loadBookings() {
    this.isLoading = true;
    this.unsubscribeBookings();
    
    this.bookingSub = this.bookingService.getBookingsByDateAndCourt(this.selectedDate, this.selectedCourt)
      .subscribe(bookings => {
        this.currentSlots = this.generateSlots(bookings);
        this.isLoading = false;
      });
  }

  onDateChange(event: any) {
    if (event.detail.value) {
      this.selectedDate = event.detail.value.split('T')[0];
      this.loadBookings();
    }
  }

  onCourtChange() {
    this.loadBookings();
  }

  async openBookingModal(slot: TimeSlot) {
    const modal = await this.modalCtrl.create({
      component: BookingModalComponent,
      componentProps: {
        date: this.selectedDate,
        time: slot.startHour,
        courtId: this.selectedCourt,
        booking: slot.booking
      },
      cssClass: 'large-modal' // Optional, can define in global.scss
    });

    await modal.present();
  }

  async confirmDelete(booking: Booking) {
    const alert = await this.alertCtrl.create({
      header: 'Konfirmim',
      message: `A jeni i sigurt që dëshironi të fshini rezervimin për <strong>${booking.emriKlientit}</strong>?`,
      buttons: [
        {
          text: 'Jo, Anulo',
          role: 'cancel'
        },
        {
          text: 'Po, Fshije',
          role: 'destructive',
          cssClass: 'alert-btn-danger',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Duke fshirë...' });
            await loading.present();
            try {
              if (booking.id) {
                await this.bookingService.deleteBooking(booking.id);
              }
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async logout() {
    await this.authService.logout();
    this.navCtrl.navigateRoot('/login');
  }
}
