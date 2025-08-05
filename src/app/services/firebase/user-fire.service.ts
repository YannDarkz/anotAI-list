import { Injectable, NgZone, inject } from '@angular/core';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { Firestore, doc, setDoc, getDoc, updateDoc, DocumentReference, DocumentSnapshot } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { Iproduct } from '../../interfaces/item-list';




export interface Icategory {
  cold: Iproduct[];
  perishables: Iproduct[];
  nonperishables: Iproduct[];
  cleaning: Iproduct[];
  others: Iproduct[];
};

const defaultCategories: Icategory = {
  cold: [],
  perishables: [],
  nonperishables: [],
  cleaning: [],
  others: []
};
export interface User {
  userId: string;
  name: string;
  email: string;
  picture: string;
  shoppingLists?: Icategory[];
  purchasedItems?: Icategory[];
}
@Injectable({
  providedIn: 'root'
})

export class UserFireService {
  private firestore = inject(Firestore);
  private ngZone = inject(NgZone);
  private schedulers = inject(ɵAngularFireSchedulers);

  private getDocInZone<T>(ref: DocumentReference<T>): Promise<DocumentSnapshot<T>> {
    return this.ngZone.run(() => getDoc(ref));
  }

  private setDocInZone<T>(ref: DocumentReference<T>, data: T): Promise<void> {
    return this.ngZone.run(() => setDoc(ref, data));
  }

  private updateDocInZone<T>(ref: DocumentReference<T>, data: Partial<T>): Promise<void> {
    return this.ngZone.run(() => updateDoc(ref, data));
  }

  async saveUser(user: User): Promise<void> {
    try {
      this.schedulers.insideAngular.schedule(() => {
        this.ngZone.run(async () => {
          const userRef = doc(this.firestore, `users/${user.userId}`);
          const userDoc = await this.getDocInZone(userRef);

          if (userDoc.exists()) {
            await this.updateDocInZone(userRef, { ...user });
          } else {
            await setDoc(userRef, {
              ...user,
              shoppingList: defaultCategories,
              purchasedItems: defaultCategories
            });
          }
        });
      });
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  /**
   * Obtém os dados do usuário pelo ID.
   */
  getUser(userId: string): Observable<User | null> {
    return from(this.getUserData(userId));
  }

  private async getUserData(userId: string): Promise<User | null> {
    try {
      return await this.ngZone.run(async () => {
        const userRef = doc(this.firestore, `users/${userId}`);
        const userDoc = await getDoc(userRef);
        return userDoc.exists() ? (userDoc.data() as User) : null;
      });
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }
}
