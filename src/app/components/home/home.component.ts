import { Component } from '@angular/core';
import { AuthButtonsComponent } from '../auth-buttons/auth-buttons.component';
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
    private userDataService: UserDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userDataService.getUserId().subscribe(userId => {
      if (userId) {
        setTimeout(() => {
          this.router.navigate(['/listItems']);
        }, 2000);
      }
    });
  }

  



}
