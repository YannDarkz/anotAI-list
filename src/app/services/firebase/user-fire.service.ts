import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';


export interface Iproduct {
  id: string;
  name: string;
  price: string;
  quantity: number;
  category: string;
  
}
export interface Icategory {
  category: string;
  products: Iproduct[];

};

const defaultCategories: Icategory[] = [
  { category: 'cold', products: [] },
  { category: 'cleaning', products: [] },
  { category: 'perishables', products: [] },
  { category: 'others', products: [] }
];
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

  constructor(private firestore: Firestore) { }

   /**
   * Salva ou atualiza o usuário no Firestore.
   * Adiciona as listas de compras e comprados se não existirem.
   */
   async saveUser(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.userId}`);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Atualiza somente os campos necessários sem sobrescrever
      await updateDoc(userRef, { ...user });
    } else {
      // Cria o documento inicial com listas vazias
      await setDoc(userRef, {
        ...user,
        shoppingLists: defaultCategories,
        purchasedItems: defaultCategories
      });
    }
  }

  /**
   * Obtém os dados do usuário pelo ID.
   */
  async getUser(userId: string): Promise<User | null> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);

    return userDoc.exists() ? (userDoc.data() as User) : null;
  }


  // async saveUser(user: any): Promise<void> {
  //   const userRef = doc(this.firestore, `users/${user.userId}`);
  //   await setDoc(userRef, user);
  // }

  // async getUser(userId: string): Promise<any> {
  //   const userRef = doc(this.firestore, `users/${userId}`);
  //   const userDoc = await getDoc(userRef);
  //   return userDoc.exists() ? userDoc.data() : null;
  // }
}
