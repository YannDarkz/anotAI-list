import { Injectable } from '@angular/core';


import { Iproduct } from '../../interfaces/item-list';
import { Firestore, doc, collection, query, where, setDoc, updateDoc, getDoc, getDocs, arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { Icategory } from '../firebase/user-fire.service';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {

  constructor(private firestore: Firestore) { }

  // async resetPurchasedItems(userId: string): Promise<void> {
  //   const userRef = doc(this.firestore, `users/${userId}`);
  //   const defaultStructure = {
  //     purchasedItems: {
  //       cold: [],
  //       perishables: [],
  //       cleaning: [],
  //       others: [],
  //     },
  //   };

  //   try {
  //     await setDoc(userRef, defaultStructure, { merge: true });
  //     console.log('Estrutura de purchasedItems restaurada com sucesso.');
  //   } catch (error) {
  //     console.error('Erro ao restaurar purchasedItems:', error);
  //     throw error;
  //   }
  // }

  // async resetShoppingList(userId: string): Promise<void> {
  //   const userRef = doc(this.firestore, `users/${userId}`);
  //   const defaultStructure = {
  //     shoppingList: {
  //       cold: [],
  //       perishables: [],
  //       cleaning: [],
  //       others: [],
  //     },
  //   };

  //   try {
  //     await setDoc(userRef, defaultStructure, { merge: true });
  //     console.log('Estrutura de shoppingList restaurada com sucesso.');
  //   } catch (error) {
  //     console.error('Erro ao restaurar shoppingList:', error);
  //     throw error;
  //   }
  // }

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

  async addItemBuy(userId: string, category: keyof Icategory, item: Iproduct): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Atualiza o objeto 'purchasedItems'
      const purchasedItems: Icategory = userData['purchasedItems'] || {};
      const updatedPurchasedItems = {
        ...purchasedItems,
        [category]: [...(purchasedItems[category] || []), item], // Adiciona o item à categoria
      };

      // Atualiza o objeto 'shoppingList' removendo o item
      const shoppingList: Icategory = userData['shoppingList'];
      const updatedShoppingList = {
        ...shoppingList,
        [category]: shoppingList[category].filter((product: Iproduct) => product.id !== item.id),
      };

      // Atualiza o documento no Firebase
      await updateDoc(userRef, {
        purchasedItems: updatedPurchasedItems,
        shoppingList: updatedShoppingList,
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

  async deleteItem(userId: string, category: keyof Icategory, itemId: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const categoriesWithItems: Icategory = userData['shoppingList'];
      console.log("cat", categoriesWithItems);


      if (categoriesWithItems[category]) {
        // Filtra os produtos removendo o item com o ID correspondente
        const updatedProducts = categoriesWithItems[category].filter(product => product.id !== itemId);

        // Atualiza a categoria com os produtos filtrados
        const updatedCategoriesWithItems = {
          ...categoriesWithItems,
          [category]: updatedProducts
        };

        // Atualiza o Firestore
        await updateDoc(userRef, { shoppingList: updatedCategoriesWithItems });
      } else {
        throw new Error(`Categoria ${category} não encontrada.`);
      }
    } else {
      throw new Error('Usuário não encontrado.');
    }
  }

  async getItemsByCategory(userId: string, category: keyof Icategory): Promise<Iproduct[]> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const categoryItems = userData['shoppingList']?.[category]; // Acessa os itens pela chave da categoria
      return categoryItems || {}; // Retorna os itens ou um array vazio se a categoria não existir
    } else {
      throw new Error('Usuário não encontrado.');
    }
  }



  async getPurchasedItems(userId: string | undefined, category: keyof Icategory): Promise<Iproduct[]> {
    try {
      // Acessa o documento do usuário
      const userRef = doc(this.firestore, `users/${userId}`);
      const userDoc = await getDoc(userRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // console.log('Dados do usuário:', userData);
  
        // Verifica se purchasedItems é um objeto
        if (typeof userData['purchasedItems'] !== 'object' || userData['purchasedItems'] === null) {
          console.warn('purchasedItems não é um objeto válido:', userData['purchasedItems']);
          return [];
        }
  
        // Verifica se a categoria existe
        if (!(category in userData['purchasedItems'])) {
          console.warn(`Categoria "${category}" não encontrada em purchasedItems.`);
          return [];
        }
  
        // Acessa diretamente os itens da categoria
        const categoryItems = userData['purchasedItems'][category];
        if (Array.isArray(categoryItems)) {
          return categoryItems as Iproduct[];
        } else {
          console.warn(`A categoria ${category} não contém uma lista válida de produtos.`);
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
      [`shoppingList.${category}`]: arrayUnion(item)
    })
  }




}
