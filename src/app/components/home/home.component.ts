import { Component } from '@angular/core';
import { AuthButtonsComponent } from '../auth-buttons/auth-buttons.component';
import { AuthService } from '@auth0/auth0-angular';

import { Router } from '@angular/router';
import { UserDataService } from '../../services/user-data/user-data.service'; 
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, AuthButtonsComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {
  
  constructor(
    private auth: AuthService,
    private userDataService: UserDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
     this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        setTimeout(() => {
          this.router.navigate(['/listItems']);
        }, 1000);
      }
    });
  }

}
