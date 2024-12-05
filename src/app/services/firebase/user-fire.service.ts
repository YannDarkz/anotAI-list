import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserFireService {

  constructor(private firestore: Firestore) { }

  async saveUser(user: any): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.userId}`);
    await setDoc(userRef, user);
  }

  async getUser(userId: string): Promise<any> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() : null;
  }
}
