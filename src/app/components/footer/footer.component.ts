import { Component } from '@angular/core';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
})
export class FooterComponent {

     generateWhatsAppLink = (phoneNumber: string, message: string): string => {
        const encodeMessage = encodeURIComponent(message)
        return `https://wa.me/${phoneNumber}?text=${encodeMessage}`
    }

}
