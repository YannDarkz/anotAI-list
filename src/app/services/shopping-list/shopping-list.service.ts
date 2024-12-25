import { Injectable } from '@angular/core';

import { Iproduct } from '../../interfaces/item-list';
import { Firestore, doc, collection, query, where, setDoc, updateDoc, getDoc, getDocs, arrayUnion, arrayRemove } from '@angular/fire/firestore';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {

  constructor( private firestore: Firestore) { }

  async resetPurchasedItems(userId: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const defaultStructure = {
      purchasedItems: {
        cold: [],
        perishables: [],
        cleaning: [],
        others: [],
      },
    };

    try {
      await setDoc(userRef, defaultStructure, { merge: true });
      console.log('Estrutura de purchasedItems restaurada com sucesso.');
    } catch (error) {
      console.error('Erro ao restaurar purchasedItems:', error);
      throw error;
    }
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

  async addItemBuy(userId: string, category: string, item: Iproduct): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);
  
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const updatedPurchasedItems = userData['purchasedItems']?.map((list: any) => {
        // Verifica se a categoria corresponde
        if (list.category === category) {
          console.log('Adicionando item na categoria:', category);
          return {
            ...list,
            products: [...list.products, item], // Adiciona o novo item
          };
        }
        return list; // Retorna a lista original para outras categorias
      });
  
      // Atualiza o documento no Firebase
      await updateDoc(userRef, {
        purchasedItems: updatedPurchasedItems,
      });
    } else {
      throw new Error('Usuário não encontrado no Firebase.');
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

  async deleteItem(userId: string, category: string, itemId: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const updatedShoppingLists = userData['shoppingLists']?.map((list: any) => {
        if (list.category === category) {
          const updatedProducts = list.products.filter((product: any) => product.id !== itemId);
          console.log("sera",updatedProducts);
          
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

  async getPurchasedItems(userId: string | undefined, category: string): Promise<Iproduct[]> {
    try {
      // Acessa o documento do usuário
      const userRef = doc(this.firestore, `users/${userId}`);
      const userDoc = await getDoc(userRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Procura dentro das listas compradas, filtrando pela categoria
        const purchasedList = userData['purchasedItems']?.find(
          (list: any) => list.category === category
        );
  
        if (purchasedList) {
          return purchasedList.products || [];
        } else {
          console.warn('Nenhum item comprado encontrado para a categoria:', category);
          return [];
        }
      } else {
        throw new Error('Usuário não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao obter itens comprados:', error);
      throw error;
    }
  }
 async removeFromPurchased(userId: string, item: Iproduct, category: string): Promise<void> {
  const purchasedRef = doc(this.firestore, `users/${userId}`);
  await updateDoc(purchasedRef, {
    [`purchasedItems.${category}`]: arrayRemove(item)
  })
 }

  async addToShoppingList(userId: string, item: Iproduct, category: string): Promise<void> {
    const shoppingRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(shoppingRef, {
      [`shoppingLists.${category}`]: arrayUnion(item)
    })
  }



 
}
