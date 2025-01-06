import { Component } from '@angular/core';
import { ProfileComponent } from "../profile/profile.component";
import { AuthButtonsComponent } from "../auth-buttons/auth-buttons.component";

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [ProfileComponent, AuthButtonsComponent],
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.scss'
})
export class MenuComponent {

}
