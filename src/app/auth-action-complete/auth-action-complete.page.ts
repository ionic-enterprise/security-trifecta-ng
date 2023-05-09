import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-auth-action-complete',
  templateUrl: './auth-action-complete.page.html',
  styleUrls: ['./auth-action-complete.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class AuthActionCompletePage {}
