import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, query, where, addDoc, doc, updateDoc, deleteDoc, Timestamp, orderBy, getDocs } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Booking {
  id?: string;
  emriKlientit: string;
  data: string;
  oraFillimit: string;
  fushaId: number;
  timestamp: any;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private firestore: Firestore = inject(Firestore);

  constructor() {}

  getBookingsByDateAndCourt(date: string, fushaId: number): Observable<Booking[]> {
    const rezervimetRef = collection(this.firestore, 'rezervimet');
    const q = query(
      rezervimetRef, 
      where('data', '==', date), 
      where('fushaId', '==', fushaId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Booking[]>;
  }

  async addBooking(booking: Booking) {
    const rezervimetRef = collection(this.firestore, 'rezervimet');
    booking.timestamp = Timestamp.now();
    return await addDoc(rezervimetRef, booking);
  }

  async updateBooking(id: string, emriKlientit: string) {
    const docRef = doc(this.firestore, `rezervimet/${id}`);
    return await updateDoc(docRef, { emriKlientit });
  }

  async deleteBooking(id: string) {
    const docRef = doc(this.firestore, `rezervimet/${id}`);
    return await deleteDoc(docRef);
  }

  async checkAvailability(date: string, time: string, fushaId: number, exceptId?: string): Promise<boolean> {
    const rezervimetRef = collection(this.firestore, 'rezervimet');
    const q = query(
      rezervimetRef, 
      where('data', '==', date), 
      where('fushaId', '==', fushaId),
      where('oraFillimit', '==', time)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return true;
    }
    
    if (exceptId) {
      let conflict = false;
      querySnapshot.forEach(doc => {
        if (doc.id !== exceptId) {
          conflict = true;
        }
      });
      return !conflict;
    }
    
    return false;
  }
}
