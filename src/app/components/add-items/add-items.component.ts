import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Iproduct } from '../../interfaces/item-list';

import { ShoppingListService } from '../../services/shopping-list/shopping-list.service';
import { UserDataService } from '../../services/user-data/user-data.service';
import { map, firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-add-items',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  providers: [CurrencyPipe],
  templateUrl: './add-items.component.html',
  styleUrl: './add-items.component.scss'
})
export class AddItemsComponent {


  @Output() itemUpdated = new EventEmitter<void>()
  @Output() notifyAddItem = new EventEmitter<void>()
  @Output() notifyEditItem = new EventEmitter<void>()

  constructor(private currencyPipe: CurrencyPipe, private formBuilder: FormBuilder, private productService: ShoppingListService, private userDataService: UserDataService) { }

  currentItemCategory: string | null = null;
  currentItemId: string | null = null

  addItemForm = this.formBuilder.group({
    name: ['', Validators.required],
    price: ['', [Validators.required, Validators.min(0)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    category: ['', Validators.required]
  });

  formatPrice(): void {
    const priceControl = this.addItemForm.get('price');
    let value = priceControl?.value?.toString().replace(/\D/g, '');
    if (value) {
      value = (parseInt(value) / 100).toFixed(2);
      priceControl?.setValue(value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'), { emitEvent: false });
    }
  }
  onPriceInput(event: Event): void {
    this.formatPrice();
  }

  editing: boolean = false

  async addItem(): Promise<void> {
    try {

      const userId = await firstValueFrom(this.userDataService.getUserId());
      const numericUserId = userId ? userId.split('|')[1] : '';

      if (!numericUserId) {
        throw new Error('User ID is undefined.');
      }

      const formValue = { ...this.addItemForm.value } as unknown as Iproduct;
      formValue.price = this.convertFormattedPriceToNumber(formValue.price.toString()).toFixed(2);

      const newItem: Iproduct = {
        ...formValue,
        id: uuidv4(),
        userId: numericUserId,

      };

      const newCategory = newItem.category?.toLowerCase();

      if (this.editing && this.currentItemId !== null) {
        if (newCategory !== this.currentItemCategory) {
          // Remove o item da categoria antiga e adiciona à nova
          await this.productService.deleteItem(numericUserId, this.currentItemCategory!, this.currentItemId);
          await this.productService.addItem(numericUserId, newCategory!, newItem);
        } else {
          // Atualiza o item na mesma categoria
          await this.productService.updateItem(numericUserId, this.currentItemCategory!, this.currentItemId, newItem);
        }
        this.notifyEditItem.emit();
        this.itemUpdated.emit();
      } else if (newCategory) {
        // Adiciona um novo item
        console.log('noistt');
        await this.productService.addItem(numericUserId, newCategory, newItem);

        this.notifyAddItem.emit();
        this.itemUpdated.emit();
      }

      this.addItemForm.reset();
      this.editing = false;
      this.currentItemId = null;
      this.currentItemCategory = null;
    } catch (error) {
      console.log('nada é');

      console.error('Erro ao adicionar item:', error);
    }
  }

  convertFormattedPriceToNumber(formattedPrice: string): number {

    if (!formattedPrice) return 0;
    const cleanPrice = formattedPrice.replace(/\./g, '').replace(',', '.');
    const parsedPrice = parseFloat(cleanPrice);

    return isNaN(parsedPrice) ? 0 : parsedPrice;
  }

  startEdit(item: Iproduct, category: string): void {
    this.addItemForm.patchValue(item);
    this.editing = true;
    this.currentItemId = item.id;
    this.currentItemCategory = category;
  }

  cancelEdit() {
    this.addItemForm.reset();
    this.editing = false;
    this.currentItemId = null;
    this.currentItemCategory = null;
  }

  get itemName() {
    return this.addItemForm.get('name')!;
  }

  get itemPrice() {
    return this.addItemForm.get('price')!;
  }

  get itemQuantity() {
    return this.addItemForm.get('quantity')!;
  }

  get itemCategory() {
    return this.addItemForm.get('category')!;
  }

}
