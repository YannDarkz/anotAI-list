import { Component, ViewChild, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardListComponent } from '../card-list/card-list.component';
import { AddItemsComponent } from '../add-items/add-items.component';
import { BuyItemComponent } from '../buy-item/buy-item.component';

import { Iproduct } from '../../interfaces/item-list';
import { Iuser } from '../../interfaces/user';
import { Icategory } from '../../services/firebase/user-fire.service';

import { UserDataService } from '../../services/user-data/user-data.service';
import { ShoppingListService } from '../../services/shopping-list/shopping-list.service';
import { ItemUpdateService } from '../../services/itemUpdate/item-update.service';

import { Subscription, forkJoin, of, from } from 'rxjs';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-list-items',
  standalone: true,
  imports: [CommonModule, CardListComponent, AddItemsComponent, BuyItemComponent,],
  templateUrl: './list-items.component.html',
  styleUrl: './list-items.component.scss'
})
export class ListItemsComponent {
  
  categoriesWithItems: Icategory = {
    cold: [],
    perishables: [],
    nonperishables: [],
    cleaning: [],
    others: []
  
  };
  userData: Iuser | null = null
  userId: string | undefined = undefined
  private updateSubscription!: Subscription;

  constructor(private userService: UserService, private http: ShoppingListService, private itemUpdateService: ItemUpdateService, private userDataService: UserDataService) {
  }

  addTextNotify = '';
  messageError = '';


  openCategory: string | null = null;

  totalPrice: number = 0

  @ViewChild(AddItemsComponent) addItemsComponent!: AddItemsComponent;
  @ViewChild(BuyItemComponent) buyItemComponent!: BuyItemComponent;



  ngOnInit(): void {
    this.userService.error$.subscribe(errorMsg => {
      this.messageError = errorMsg;
    });

    this.updateSubscription = this.itemUpdateService.updateItems$.subscribe(() => {
      this.loadItems();
    });

    this.userDataService.getUserData().subscribe(data => {
      this.userData = data;
      // console.log("UserData", data);

      this.userId = data?.userId

      if (this.userId) {
        setTimeout(() => {
          this.loadItems();
        }, 100);

      }
    });
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    this.addItemsComponent.itemUpdated.subscribe(() => {
      this.loadItems();
    });

    this.buyItemComponent.itemUpdated.subscribe(() => {
      this.loadItems();
    });
  }

  loadItems(): void {
    const categoryOrder = ['cold', 'perishables', 'nonperishables', 'cleaning', 'others'];

    const loadPromises = Object.keys(this.categoriesWithItems).map(async (category) => {
      if (this.userId) {
        try {
          const data = await this.http.getItemsByCategory(this.userId, category as keyof Icategory);
          this.categoriesWithItems[category as keyof Icategory] = data;
        } catch (error) {
          this.showError(error instanceof Error ? error.message : 'Erro ao carregar itens.');
        }
      }
    });

    Promise.all(loadPromises).then(() => {
      // console.log('Before sorting:', this.categoriesWithItems);
      // this.categoriesWithItems = Object.keys(this.categoriesWithItems)
      // .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
      // .reduce((sortedCategories, key) => {
      //   sortedCategories[key as keyof Icategory] = this.categoriesWithItems[key as keyof Icategory];
      //   return sortedCategories;
      // }, {} as Icategory);

      this.calculateTotalPrice();
    });
  }

  async deleteItem(category: keyof Icategory, itemId: string): Promise<void> {
    if (this.userId) {
      try {

        await this.http.deleteItem(this.userId, category, itemId);

        if (this.categoriesWithItems[category]) {
          this.categoriesWithItems[category] = this.categoriesWithItems[category].filter(item => item.id !== itemId);
          console.log('existentes', this.categoriesWithItems[category]);

        } else {
          console.error(`Categoria ${category} não existe localmente.`);
        }

        this.loadItems();
        this.notifyRemoveItem();
      } catch (error) {
        console.error('Erro ao deletar item:', error);
      }
    } else {
      console.error('User ID não encontrado.');
    }
  }

  async buyItem(item: Iproduct, category: keyof Icategory): Promise<void> {
    if (this.userId) {
      try {
        // Chama o serviço para mover o item
        await this.http.addItemBuy(this.userId, category, item);
        this.itemUpdateService.triggerUpdateItems();

        // Recarrega os dados da interface
        this.loadItems();
        this.buyItemComponent.loadPurchasedItems();
        this.notifyAddBuyItem(); // Notifica o usuário
      } catch (error) {
        console.error('Erro ao comprar item:', error);
      }
    } else {
      console.error('User ID não encontrado.');
    }
  }

  calculateTotalPrice(): void {
    this.totalPrice = Object.values(this.categoriesWithItems).reduce((acc, items) => {
      const categoryTotal = items.reduce((sum: number, item: Iproduct) => {
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



  maskCurrency = (valor: number, locale = 'pt-BR', currency = 'BRL') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(valor)
  }

  editItem(item: Iproduct, id: number, category: string): void {

    if (this.addItemsComponent) {
      this.addItemsComponent.startEdit(item, category);
      this.scrollToTop();
    } else {
      console.log('addItemsComponent não está inicializado');
    }
  }

  toggleDetails(category: string): void {
    if (this.openCategory === category) {
      this.openCategory = null;
    } else {
      this.openCategory = category;
    }
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
  clearList(): void {
    localStorage.removeItem('listaCompras');
  }

  scrollToTop(): void {
    const scrollDuration = 30;
    const startPosition = window.scrollY;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / scrollDuration, 1);
      const scrollPosition = startPosition * (1 - progress);

      window.scrollTo(0, scrollPosition);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }



  showError(message: string): void {
    this.messageError = message;
    setTimeout(() => {
      this.messageError = '';
    }, 3000);
  }


  notifyAddItem(): void {
    this.addTextNotify = 'adcionado com sucesso! ✅'
    setTimeout(() => {
      this.addTextNotify = ''
    }, 2000)
  }

  notifyEditItem(): void {
    this.addTextNotify = 'Editado com sucesso! ✅'
    setTimeout(() => {
      this.addTextNotify = ''
    }, 2000)
  }

  notifyRemoveItem(): void {
    this.addTextNotify = 'Removido com sucesso! ✅'
    setTimeout(() => {
      this.addTextNotify = ''
    }, 1000)
  }

  notifyRevertItem(): void {
    this.addTextNotify = 'Removido do Carrinho! ✅'
    setTimeout(() => {
      this.addTextNotify = ''
    }, 1000)
  }

  notifyAddBuyItem(): void {
    this.addTextNotify = 'adcionado No carrinho! ✅'
    setTimeout(() => {
      this.addTextNotify = ''
    }, 1500)
  }




}
