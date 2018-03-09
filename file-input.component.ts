import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  Input,
  AfterViewInit,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { FileInfo } from './file-info.model';

@Component({
  selector: 'file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FileInputComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fileInput') private fileInput: ElementRef;
  @ViewChild('dropBox') private dropBox: ElementRef;
  @Input() set allowDrop(value: boolean) {
    this.showDrop = value;
    if (this.showDrop) {
      this.registerDragDrop();      
    } else {
      this.unregisterDragDrop();
    }
  }
  @Input() set acceptedFileTypes (value: string[]) {
    this.fileTypeFilter = [];      
    value.forEach(ft => {
      this.fileTypeFilter.push(ft);
    });
  } 
  @Input() set allowMultiple(value: boolean) {
    this.isMultiple = value;
  }
  private _selectedFiles: FileInfo[] = [];  
  private dragDropSubscription: Subscription;
  private invalidFiles: FileInfo[] = [];
  fileTypeFilter: string[];
  showDrop = true;
  isMultiple = true;

  private get acceptedFileTypeString (): string {
    if (this.fileTypeFilter && this.fileTypeFilter.length > 0) {
      return 'Accepted file types (' + this.fileTypeFilter.join(', ') + ')'; 
    } 

    return 'Accepted file types ( All )';
  }

  public get selectedFiles() : FileInfo[] {
    return this._selectedFiles;
  }

  constructor() { }

  ngOnInit() {
    
  }

  ngAfterViewInit() {
    this.registerDragDrop();
  }

  ngOnDestroy() {
    this.dragDropSubscription.unsubscribe();
  }

  private registerDragDrop(): void {
    this.unregisterDragDrop();
    this.dragDropSubscription = new Subscription();
    let element = document.querySelector("div.drop-box");  
    if (element) {
      const dragEnter = Observable.fromEvent(element, 'dragenter');
      const drop = Observable.fromEvent(element, 'drop');
      const dragOver = Observable.fromEvent(element, 'dragover');

      this.dragDropSubscription.add(dragEnter.subscribe((e: any) => this.doDragEnter(e)));

      this.dragDropSubscription.add(dragOver.subscribe((e: any) => {
        e.preventDefault();
        console.log('dragover')
        this.dragOver(e);
      }));

      this.dragDropSubscription.add(drop.subscribe((e: any) => {
        e.preventDefault();
        this.doDrop(e);
      }));
    }
  }

  private unregisterDragDrop(): void {
    if (this.dragDropSubscription !== undefined) {
      this.dragDropSubscription.unsubscribe();
    }
  }

  private doDrop(e: DragEvent): void {
    this.invalidFiles = [];
    let files = e.dataTransfer.files;
    this.processFiles(files);    
  }

  private processFiles(files: FileList) {
    this.invalidFiles = [];    
    let fileCount: number = files.length;
    if (!this.isMultiple) {
      fileCount = 1;
      this._selectedFiles = [];
    }    
    for (let i = 0; i < fileCount; i++) {
      let file = files[i];  
      if(this._selectedFiles.findIndex(f => f.name === file.name) < 0) {    
        let fileType = this.resolveFileType(file);
        if (fileType && file.size > 0) {
          let reader = new FileReader();          
            reader.onload = () => {                      
              this._selectedFiles.push(new FileInfo(file.name, fileType, file.size, reader.result.split(',')[1], file.lastModifiedDate))
            };
            reader.readAsDataURL(file);        
        } else {
          this.invalidFiles.push(new FileInfo(file.name, fileType, file.size, null, file.lastModifiedDate))
        }
      }
    }
  }

  private doDragEnter(e: DragEvent): void {
    // console.log(e.dataTransfer.items);
    if (e.dataTransfer.types.findIndex(t => t === 'Files') < 0) {          
      e.dataTransfer.dropEffect = 'none';     
    } else {
      if (this.isMultiple || e.dataTransfer.items.length == 1 ) {
        e.dataTransfer.effectAllowed = 'copyMove';
      } else {
        e.dataTransfer.dropEffect = 'none';     
      }
    }
  }

  private dragOver(e: DragEvent): void {
    if (e.dataTransfer.types.findIndex(t => t === 'Files') < 0) {          
      e.dataTransfer.dropEffect = 'none';     
    } else {
      if (this.isMultiple || e.dataTransfer.items.length == 1 ) {
        e.dataTransfer.effectAllowed = 'copyMove';
      } else {
        e.dataTransfer.dropEffect = 'none';     
      }
    }
  }


  private fileTypeIsAllowed(fileType: string): boolean {
    return this.fileTypeFilter.findIndex(f => f.toUpperCase() === fileType.toUpperCase()) > -1;
  }

  private onFileInputChange($event: any): void {    
    let selectedFiles = $event.target.files as FileList;
    this.processFiles(selectedFiles);    
  }

  private removeItem(file: FileInfo) {
    let index = this._selectedFiles.findIndex(fi => fi.name === file.name); 
    if (index > -1) {    
      this._selectedFiles.splice(index, 1);
    }    
    this.fileInput.nativeElement.value = '';
  }

  private clearFiles(): void {
    this.fileInput.nativeElement.value = '';
    this._selectedFiles = [];
    this.invalidFiles = [];
  }

  private resolveFileType(file: File): string {
    let split = file.name.split('.');
    let fileTypeString = split[split.length - 1];
    let fileType = fileTypeString;
    if (this.fileTypeFilter) {
      fileType = this.fileTypeFilter.find(f => f.toUpperCase() === fileTypeString.toUpperCase())
    }
    return fileType;
  }

}
