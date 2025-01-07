import { Component, ElementRef, ViewChild } from '@angular/core';
import { ProfileComponent } from "../profile/profile.component";
import { AuthButtonsComponent } from "../auth-buttons/auth-buttons.component";
import { ViewportScroller } from '@angular/common';


import * as bootstrap from 'bootstrap';
import { Modal } from 'bootstrap';

import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [ProfileComponent, AuthButtonsComponent, FormsModule],
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.scss'
})
export class MenuComponent {

    constructor(private viewportScroller: ViewportScroller) {}

    scrollToElement(elementId: string): void {
      this.viewportScroller.scrollToAnchor(elementId);
    }

    @ViewChild('feedbackModal') feedbackModal!: ElementRef;

    feedback = {
        title: '',
        description: ''
      };
    
      sendFeedback() {
        // Verifica se os campos estão preenchidos
        if (!this.feedback.title || !this.feedback.description) {
          alert('Por favor, preencha todos os campos antes de enviar.');
          return;
        }
    
        // Prepara o objeto de feedback
        const feedbackData = {
          ...this.feedback,
          timestamp: new Date().toISOString() // Adiciona a data e hora do envio
        };
    
        console.log('Feedback pronto para envio:', feedbackData);
    
        // Aqui você pode implementar a lógica para enviar o feedback ao banco de dados
        // Por exemplo, usando um serviço Angular para fazer a requisição HTTP
        // this.feedbackService.sendFeedback(feedbackData).subscribe(() => {
        //   alert('Feedback enviado com sucesso!');
        //   this.resetFeedback();
        // });
    
        // Por enquanto, apenas limpa o formulário
        this.resetFeedback();
        this.closeModal();
      }
    
      resetFeedback() {
        this.feedback = {
          title: '',
          description: ''
        };
      }

      closeModal() {
        const modalElement = this.feedbackModal.nativeElement;
        // const modalInstance = Modal.getInstance(modalElement);
        // if (modalInstance) {
        //     modalInstance.hide();
        //   }
        // modalInstance.dispose();

        // const overlay = document.querySelector('.modal-backdrop');
        // if (overlay) {
        //   overlay.remove();
        // }
      }


}
