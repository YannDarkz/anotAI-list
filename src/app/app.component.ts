import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { RouterOutlet, Router } from '@angular/router';
import { UserService } from './services/user/user.service';
import { UserFireService } from './services/firebase/user-fire.service';

// import { CommonModule } from '@angular/common';
// import { AuthButtonsComponent } from './components/auth-buttons/auth-buttons.component';
import { UserDataService } from './services/user-data/user-data.service';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from "./components/footer/footer.component";

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, HeaderComponent, FooterComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  constructor(public auth: AuthService, private userFireService: UserFireService, private router: Router, private userService: UserService, private userDataService: UserDataService) { }


  showError(message: string) {
    alert(message); 
  }

  ngOnInit() {
    this.auth.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.router.navigate(['/listItems']);

        this.auth.user$.subscribe(user => {
          if (user) {
            const userData = {
              userId: user.sub ? user.sub.split('|')[1] : '',
              name: user.name || 'Usuário sem nome',
              email: user.email || '',
              picture: user.picture || ''
            };

            // Salva os dados do usuário no Firestore
            this.userFireService.saveUser(userData)
              .then(() => {
                // console.log('Usuário salvo com sucesso no Firestore.');
                this.userDataService.setUserData(userData); // Atualiza o serviço com os dados do usuário
              })
              .catch((error) => {
                console.error('Erro ao salvar o usuário no Firestore:', error);
                this.showError('Falha ao salvar os dados do usuário.');
              });
          }
        });
      }
    });
  }

}
