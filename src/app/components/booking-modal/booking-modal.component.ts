import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { BookingService, Booking } from '../../services/booking.service';

@Component({
  selector: 'app-booking-modal',
  templateUrl: './booking-modal.component.html',
  styleUrls: ['./booking-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class BookingModalComponent implements OnInit {
  @Input() date!: string;
  @Input() time!: string;
  @Input() courtId!: number;
  @Input() booking?: Booking;

  bookingForm: FormGroup;
  isSaving = false;

  private modalCtrl = inject(ModalController);
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private toastCtrl = inject(ToastController);

  constructor() {
    this.bookingForm = this.fb.group({
      emriKlientit: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit() {
    if (this.booking) {
      this.bookingForm.patchValue({
        emriKlientit: this.booking.emriKlientit
      });
    }
  }

  get fushaName(): string {
    return this.courtId === 1 ? 'Fusha 1' : 'Fusha 2';
  }

  get formattedDateAlbanian(): string {
    if (!this.date) return '';
    const dateObj = new Date(this.date);
    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    const months = ["Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor", "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor"];
    const ditaJaves = dateObj.getDay(); // 0 defaults to Sunday
    const days = ["E Diel", "E Hënë", "E Martë", "E Mërkurë", "E Enjte", "E Premte", "E Shtunë"];
    
    return `${days[ditaJaves]}, ${day} ${months[month]} ${year}`;
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async save() {
    if (this.bookingForm.invalid) {
      this.showToast('Ju lutem shkruani emrin e personit.');
      return;
    }

    this.isSaving = true;
    const emriKlientit = this.bookingForm.value.emriKlientit;

    try {
      if (this.booking?.id) {
        await this.bookingService.updateBooking(this.booking.id, emriKlientit);
        this.modalCtrl.dismiss(null, 'saved');
      } else {
        const isAvailable = await this.bookingService.checkAvailability(this.date, this.time, this.courtId);
        if (!isAvailable) {
          this.isSaving = false;
          this.showToast('Gabim: Kjo orë është e zënë në këtë fushë!');
          return;
        }

        const newBooking: Booking = {
          emriKlientit,
          data: this.date,
          oraFillimit: this.time,
          fushaId: this.courtId,
          timestamp: null
        };

        await this.bookingService.addBooking(newBooking);
        this.modalCtrl.dismiss(null, 'saved');
      }
    } catch (error) {
      this.isSaving = false;
      this.showToast('Ndodhi një gabim gjatë ruajtjes!');
    }
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    await toast.present();
  }
}
