import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Topbar } from '../topbar/topbar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  // ¡Aquí es donde Angular conecta las piezas!
  imports: [RouterOutlet, Topbar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css' 
})
export class MainLayout{

}