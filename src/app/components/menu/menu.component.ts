import { Component, ElementRef, ViewChild } from '@angular/core';
import { ProfileComponent } from "../profile/profile.component";
import { AuthButtonsComponent } from "../auth-buttons/auth-buttons.component";
import { CommonModule, ViewportScroller } from '@angular/common';
import { UserDataService } from '../../services/user-data/user-data.service';

import * as bootstrap from 'bootstrap';
import { Modal } from 'bootstrap';

import { FormsModule } from '@angular/forms';
import { Iuser } from '../../interfaces/user';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [ProfileComponent, AuthButtonsComponent, FormsModule, CommonModule],
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.scss'
})
export class MenuComponent {

    addTextNotify: string = ''



    constructor(private userDataService: UserDataService, private viewportScroller: ViewportScroller) { }
    userData: Iuser | null = null


    ngOnInit(): void {

        this.userDataService.getUserData().subscribe(data => {
            this.userData = data
        })


    }

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
        this.notifyFeedeback()
        console.log('Feedback pronto para envio:', feedbackData);

        this.resetFeedback();

    }

    resetFeedback() {
        this.feedback = {
            title: '',
            description: ''
        };
    }

    notifyFeedeback(): void {
        this.addTextNotify = 'Feedback enviado! ✅'
        setTimeout(() => {
            this.addTextNotify = ''
        }, 1500)
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
