import { Injectable } from '@angular/core';
import { Iproduct } from '../../interfaces/item-list';
import { Firestore, doc, collection, setDoc, updateDoc, getDoc, arrayUnion, arrayRemove } from '@angular/fire/firestore';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {

  constructor(private http: HttpClient, private firestore: Firestore) { }
  
  private apiUrl = 'http://localhost:3000';

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro inesperado. Tente novamente em alguns segundos.'
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`
    } else {
      switch (error.status) {
        case 404:
        errorMessage = 'Recurso não encontrado.';
        break;
        case 500:
          errorMessage = 'Erro interno do servidor.';
          break;
          default:
            errorMessage = `Erro ${error.status}: ${error.message}`
            break;
      }
    }

    return throwError(() => new Error(errorMessage))
  }


  async addItem(userId: string, category: string, item: Iproduct): Promise<void> {
    
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const updatedShoppingLists = userData['shoppingLists']?.map((list: any) => {
        if (list.category === category) {
          console.log('dados run');
          
          return { ...list, products: [...list.products, item] };
        }
        return list;
      });

      await updateDoc(userRef, { shoppingLists: updatedShoppingLists });
    } else {
      throw new Error('Usuário não encontrado.');
    }
  }

  async updateItem(userId: string, category: string, itemId: string, updatedItem: Iproduct): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const updatedShoppingLists = userData['shoppingLists']?.map((list: any) => {
        if (list.category === category) {
          const updatedProducts = list.products.map((product: any) =>
            product.id === itemId ? updatedItem : product
          );
          return { ...list, products: updatedProducts };
        }
        return list;
      });

      await updateDoc(userRef, { shoppingLists: updatedShoppingLists });
    } else {
      throw new Error('Usuário não encontrado.');
    }
  }

  // Remove um item de uma categoria
  async deleteItem(userId: string, category: string, itemId: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const updatedShoppingLists = userData['shoppingLists']?.map((list: any) => {
        if (list.category === category) {
          const updatedProducts = list.products.filter((product: any) => product.id !== itemId);
          return { ...list, products: updatedProducts };
        }
        return list;
      });

      await updateDoc(userRef, { shoppingLists: updatedShoppingLists });
    } else {
      throw new Error('Usuário não encontrado.');
    }
  }

  async getItemsByCategory(userId: string, category: string): Promise<Iproduct[]> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);
  
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const list = userData['shoppingLists']?.find((list: any) => list.category === category);
      return list?.products || [];
    } else {
      throw new Error('Usuário não encontrado.');
    }
  }

 
}
