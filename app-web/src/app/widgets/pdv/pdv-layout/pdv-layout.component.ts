import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToppdvComponent } from '../toppdv/toppdv.component';
import { LeftpdvComponent } from '../leftpdv/leftpdv.component';
import { Rightpdv2Component } from '../rightpdv2/rightpdv2.component';

@Component({
  selector: 'pdv-layout',
  standalone: true,
  imports: [CommonModule, ToppdvComponent, LeftpdvComponent, Rightpdv2Component],
  templateUrl: './pdv-layout.component.html',
  styleUrls: ['./pdv-layout.component.scss']
})
export class PdvLayoutComponent {}
