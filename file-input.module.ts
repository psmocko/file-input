import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import {
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
} from '@angular/material';
import { CommonModule } from '@angular/common';
import { FileInputComponent } from './file-input.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,        
    ReactiveFormsModule,    
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
  ],
  declarations: [
    FileInputComponent
  ],
  exports: [
    FileInputComponent
  ]
})
export class FileInputModule { }
