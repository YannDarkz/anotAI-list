import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Iproduct } from '../../interfaces/item-list';

import { ShoppingListService } from '../../services/shopping-list/shopping-list.service';
import { UserDataService } from '../../services/user-data/user-data.service';
import { map, firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { Firestore, getDoc, doc, updateDoc } from '@angular/fire/firestore';

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

  constructor(private firestore: Firestore, private formBuilder: FormBuilder, private productService: ShoppingListService, private userDataService: UserDataService) { }

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
      if (!newCategory) {
        throw new Error('Category is undefined.');
      }

      const userRef = doc(this.firestore, `users/${numericUserId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found.');
      }

      const userData = userDoc.data();
      const currentShoppingList = userData['shoppingList'] || {};

      if (this.editing && this.currentItemId !== null) {
        // Edição de item
        if (newCategory !== this.currentItemCategory) {
          // Remover o item da categoria antiga
          const oldCategoryItems = [...(currentShoppingList[this.currentItemCategory!] || [])];
          const filteredItems = oldCategoryItems.filter(item => item.id !== this.currentItemId);
          currentShoppingList[this.currentItemCategory!] = filteredItems;

          // Adicionar o item à nova categoria
          const newCategoryItems = [...(currentShoppingList[newCategory] || []), newItem];
          currentShoppingList[newCategory] = newCategoryItems;

        } else {
          // Atualizar o item na mesma categoria
          const categoryItems = [...(currentShoppingList[newCategory] || [])];
          const updatedItems = categoryItems.map(item =>
            item.id === this.currentItemId ? newItem : item
          );
          currentShoppingList[newCategory] = updatedItems;
        }

        this.notifyEditItem.emit();
      } else {
        // Adição de novo item
        const updatedCategoryItems = [...(currentShoppingList[newCategory] || []), newItem];
        currentShoppingList[newCategory] = updatedCategoryItems;

        this.notifyAddItem.emit();
      }

      // Atualiza o documento no Firebase
      await updateDoc(userRef, { shoppingList: currentShoppingList });

      // Resetando o estado
      this.addItemForm.reset({
        name: '',
        price: '',
        quantity: 1,
        category: ''
      });
      this.editing = false;
      this.currentItemId = null;
      this.currentItemCategory = null;
      this.itemUpdated.emit();

    } catch (error) {
      console.error('Erro ao adicionar/editar item:', error);
    }
  }

  convertFormattedPriceToNumber(formattedPrice: string): number {

    if (!formattedPrice) return 0;
    const cleanPrice = formattedPrice.replace(/\./g, '').replace(',', '.');
    const parsedPrice = parseFloat(cleanPrice);

    return isNaN(parsedPrice) ? 0 : parsedPrice;
  }

  startEdit(item: Iproduct, category: string): void {
    const itemEdit = { ...item, price: '' }
    this.addItemForm.patchValue(itemEdit);

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

  increment(): void {
    const currentQuantity = this.addItemForm.get('quantity')?.value || 0;
    this.addItemForm.get('quantity')?.setValue(currentQuantity + 1);
  }

  decrement(): void {
    const currentQuantity = this.addItemForm.get('quantity')?.value || 0;
    if (currentQuantity > 1) {
      this.addItemForm.get('quantity')?.setValue(currentQuantity - 1);
    }
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
