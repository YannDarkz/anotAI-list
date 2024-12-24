import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardBuyItemComponent } from '../card-buy-item/card-buy-item.component';

import { ShoppingListService } from '../../services/shopping-list/shopping-list.service';
import { ItemUpdateService } from '../../services/itemUpdate/item-update.service';
import { Iproduct } from '../../interfaces/item-list';
import { UserDataService } from '../../services/user-data/user-data.service';

import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-buy-item',
  standalone: true,
  imports: [CommonModule, CardBuyItemComponent],
  templateUrl: './buy-item.component.html',
  styleUrl: './buy-item.component.scss',
  providers: [ShoppingListService]
})
export class BuyItemComponent {

  userId: string | undefined = undefined;

  constructor(private shoppingService: ShoppingListService, private userData: UserDataService, private itemUpdateService: ItemUpdateService) { }

  purchasedItems: { category: string; products: Iproduct[] }[] = [
    { category: 'cold', products: [] },
    { category: 'perishables', products: [] },
    { category: 'cleaning', products: [] },
    { category: 'others', products: [] },
  ];

  openCategory: string | null = null;

  buyPrice: number = 0

  @Output() itemRemoved = new EventEmitter<void>();
  @Output() removeItemBuy = new EventEmitter<void>()

  async ngOnInit(): Promise<void> {
    this.userData.getUserData().pipe(
      filter(data => data !== null) // Ignora valores `null`
    )
      .subscribe(data => {
        if (data?.userId) {
          this.userId = data.userId;
          this.loadPurchasedItems(); // Agora só será chamado quando houver um `userId`
        } else {
          console.error('User ID não encontrado após filtragem.');
        }
      });
  }

  async loadPurchasedItems(): Promise<void> {
    for (const categoryObj of this.purchasedItems) {
      try {
        const items = await this.shoppingService.getPurchasedItems(this.userId, categoryObj.category);
        categoryObj.products = items;
        this.calculateTotalPrice();
      } catch (error) {
        console.error(`Erro ao carregar itens comprados da categoria ${categoryObj.category}:`, error);
      }
    }
    console.log('pu', this.purchasedItems);

  }

  resetPurchasedItems(): void {
    if (!this.userId) {
      console.error('User ID não definido.');
      return;
    }

    this.shoppingService.resetPurchasedItems(this.userId)
      .then(() => console.log('Estrutura restaurada no Firebase.'))
      .catch(error => console.error('Erro ao restaurar estrutura:', error));
  }

  toggleDetails(category: string): void {
    if (this.openCategory === category) {
      this.openCategory = null;
    } else {
      this.openCategory = category;
    }
  }

  calculateTotalPric(): void {
    this.buyPrice = this.purchasedItems.reduce(
      (total, categoryObj) =>
        total + categoryObj.products.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0),
      0
    );

    console.log(this.buyPrice);

  }

  calculateTotalPrice(): void {
    this.buyPrice = this.purchasedItems
      .reduce((acc, categoryObj) => {
        const categoryTotal = (categoryObj.products || []).reduce((sum, item) => {
          // console.log('Tipo da variável item.price:', typeof item.price, item.price);
          const price = this.convertFormattedPriceToNumber(item.price);
          // console.log('Tipo da variável price:', typeof price, price);

          const quantity = item.quantity || 1;
          return sum + price * quantity;
        }, 0);
        return acc + categoryTotal;
      }, 0);
  }

  convertFormattedPriceToNumber(formattedPrice: string): number {
    if (!formattedPrice) return 0;

    // console.log("chegando", formattedPrice, typeof formattedPrice);

    // const cleanPrice = formattedPrice.replace(/\./g, '').replace(',', '.');
    // const cleanPrice = formattedPrice.replace(',', '.');
    // console.log("meio", cleanPrice, typeof cleanPrice);
    const parsedPrice = Number.parseFloat(formattedPrice);
    // console.log("fim?",  typeof cleanPrice,  typeof parsedPrice, this.maskCurrency(parsedPrice), "karai", parseFloat(this.maskCurrency(parsedPrice)) );

    return isNaN(parsedPrice) ? 0 : parsedPrice;
  }

  // removeFromPurchasedItems(category: string, index: number): void {
  //   const categoryObj = this.purchasedItems.find(cat => cat.category === category);
  //   if (!categoryObj) return;

  //   const itemToRemove = categoryObj.products[index];

  //   // Remover o item do array de comprados e do servidor
  //   this.shoppingService.removePurchasedItem(itemToRemove).subscribe({
  //     next: () => {
  //       categoryObj.products.splice(index, 1);
  //       this.calculateTotalPrice();
  //       this.itemRemoved.emit();
  //       this.removeItemBuy.emit();

  //       // Adicionar o item de volta à lista de compras original
  //       this.shoppingService.addBackToShoppingList(itemToRemove).subscribe({
  //         next: () => {
  //          console.log('Item adicionado de volta à lista de compras');
  //          this.itemUpdateService.triggerUpdateItems();
  //         },

  //         error: (error) => console.error("Erro ao retornar item para a lista de compras:", error)
  //       });
  //     },
  //     error: (error) => console.error("Erro ao remover item comprado:", error)
  //   });
  // }

  removeFromPurchasedItemst(category: string, index: number) {
    if (!this.userId) {
      console.error('User ID não encontrado.');
      return;
    }

    const categoryObj = this.purchasedItems.find(cat => cat.category === category);
    if (!categoryObj) {
      console.error(`Categoria ${category} não encontrada.`);
      return;
    }

    const itemToRemove = categoryObj.products[index];

    // Remove da lista de comprados e adiciona de volta à lista de compras
    this.shoppingService
      .removeFromPurchased(this.userId, itemToRemove, category)
      .then(() => this.shoppingService.addToShoppingList(this.userId!, itemToRemove, category))
      .then(() => {
        categoryObj.products.splice(index, 1); // Remove o item localmente
        this.calculateTotalPrice(); // Atualiza o preço total
        console.log('Item movido para a lista de compras com sucesso.');
      })
      .catch(error => {
        console.error('Erro ao mover o item:', error);
      });

  }

}


