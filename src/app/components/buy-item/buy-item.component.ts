import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardBuyItemComponent } from '../card-buy-item/card-buy-item.component';

import { ShoppingListService } from '../../services/shopping-list/shopping-list.service';
import { ItemUpdateService } from '../../services/itemUpdate/item-update.service';
import { Iproduct } from '../../interfaces/item-list';
import { UserDataService } from '../../services/user-data/user-data.service';

import { filter } from 'rxjs/operators';
import { Icategory } from '../../services/firebase/user-fire.service';

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
  @Output() itemUpdated = new EventEmitter<void>()

  constructor(private shoppingService: ShoppingListService, private userData: UserDataService, private itemUpdateService: ItemUpdateService) { }

  categoriesWithItems: Icategory = {
    cold: [],
    perishables: [],
    nonperishables: [],
    cleaning: [],
    others: []

  };

  openCategory: string | null = null;

  buyPrice: number = 0

  @Output() itemRemoved = new EventEmitter<void>();
  @Output() removeItemBuy = new EventEmitter<void>()

  async ngOnInit(): Promise<void> {
    this.userData
      .getUserData()
      .pipe(filter(data => data !== null) // Ignora valores `null`
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
    for (const category of Object.keys(this.categoriesWithItems) as (keyof Icategory)[]) {
      try {
        const items = await this.shoppingService.getPurchasedItems(this.userId, category);
        this.categoriesWithItems[category] = items;
        this.calculateTotalPrice();
      } catch (error) {
        console.error(`Erro ao carregar itens comprados da categoria ${category}:`, error);
      }
    }
  }

  toggleDetails(category: string): void {
    if (this.openCategory === category) {
      this.openCategory = null;
    } else {
      this.openCategory = category;
    }
  }


  calculateTotalPrice(): void {
    this.buyPrice = Object.values(this.categoriesWithItems).reduce((acc, products) => {
      const categoryTotal = products.reduce((sum: number, item: Iproduct) => {
        // Converte o preço formatado para número, se necessário
        const price = this.convertFormattedPriceToNumber(item.price);
        const quantity = item.quantity || 1;
        return sum + price * quantity;
      }, 0);
      return acc + categoryTotal;
    }, 0);
  }

  convertFormattedPriceToNumber(formattedPrice: string): number {
    if (!formattedPrice) return 0;
    const parsedPrice = Number.parseFloat(formattedPrice);
    return isNaN(parsedPrice) ? 0 : parsedPrice;
  }

  removeFromPurchasedItems(category: keyof Icategory, index: number) { 
    if (!this.userId) {
      console.error('User ID não encontrado.');
      return;
    }
  
    const categoryItems = this.categoriesWithItems[category];
    if (!categoryItems) {
      console.error(`Categoria ${category} não encontrada.`);
      return;
    }
  
    const itemToRemove = categoryItems[index];
  
    // Remove da lista de comprados e adiciona de volta à lista de compras
    this.shoppingService
      .removeFromPurchased(this.userId, itemToRemove, category)
      .then(() => this.shoppingService.addToShoppingList(this.userId!, itemToRemove, category))
      .then(() => {
        categoryItems.splice(index, 1); // Remove o item localmente
        this.calculateTotalPrice(); // Atualiza o preço total
        this.itemUpdated.emit();
        console.log('Item movido para a lista de compras com sucesso.');
      })
      .catch(error => {
        console.error('Erro ao mover o item:', error);
      });
  }

  categoriaPT(category: string): string {
    switch (category) {
      case 'cold':
        return 'frios';
      case 'perishables':
        return 'perecíveis';
      case 'nonperishables':
        return 'não perecíveis';
      case 'cleaning':
        return 'limpeza';
      case 'others':
        return 'outros';
      default:
        return category
    }
  }

}


