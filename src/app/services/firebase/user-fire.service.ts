import { ChangeDetectorRef, Injectable, NgZone } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
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

  constructor(private firestore: Firestore,  private ngZone: NgZone) { }

   /**
   * Salva ou atualiza o usuário no Firestore.
   * Adiciona as listas de compras e comprados se não existirem.
   */
   async saveUser(user: User): Promise<void> {
    this.ngZone.run(async () => {
      const userRef = doc(this.firestore, `users/${user.userId}`);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        await updateDoc(userRef, { ...user });
      } else {
        await setDoc(userRef, {
          ...user,
          shoppingList: defaultCategories,
          purchasedItems: defaultCategories
        });
      }

      // this.cdRef.detectChanges();
    });
  }

  /**
   * Obtém os dados do usuário pelo ID.
   */
  async getUser(userId: string): Promise<User | null> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);

    return userDoc.exists() ? (userDoc.data() as User) : null;
  }
}
