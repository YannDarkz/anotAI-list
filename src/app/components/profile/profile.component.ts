import { Component } from '@angular/core';
import { UserDataService } from '../../services/user-data/user-data.service';
import { Iuser } from '../../interfaces/user';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
   userData: Iuser | null = null

  constructor( private userDataService: UserDataService) {}

  ngOnInit(): void {

    this.userDataService.getUserData().subscribe( data => {
      this.userData = data
      console.log("profileData", data);
      
    })


  }





}
