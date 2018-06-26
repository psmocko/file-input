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
import { FileDataType } from './file-data-type.enum';

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
  @Input() set fileDataType(value: string) {
    const fileDataType = FileDataType[value];
    this._fileDataType = fileDataType;
  }

  private _selectedFiles: FileInfo[] = [];
  private _fileDataType: FileDataType = FileDataType.Base64String;
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

  public get selectedFiles(): FileInfo[] {
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
    const element = document.querySelector('div.drop-box');
    if (element) {
      const dragEnter = Observable.fromEvent(element, 'dragenter');
      const drop = Observable.fromEvent(element, 'drop');
      const dragOver = Observable.fromEvent(element, 'dragover');

      this.dragDropSubscription.add(dragEnter.subscribe((e: any) => this.doDragEnter(e)));

      this.dragDropSubscription.add(dragOver.subscribe((e: any) => {
        e.preventDefault();
        console.log('dragover');
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
    const files = e.dataTransfer.files;
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
      const file = files[i];
      if (this._selectedFiles.findIndex(f => f.name === file.name) < 0) {
        const fileType = this.resolveFileType(file);
        if (fileType && file.size > 0) {
          const reader = new FileReader();
            reader.onload = () => {
              this._selectedFiles.push(this.createFileInfo(reader, file.name, fileType, file.size, file.lastModifiedDate));
            };
            switch (+this._fileDataType) {
              case FileDataType.Base64String:
                reader.readAsDataURL(file);
                break;
              case FileDataType.ByteArray:
                reader.readAsArrayBuffer(file);
                break;
              case FileDataType.Text:
                reader.readAsText(file);
                break;
              default:
                throw new Error('Invalid file data type.');
            }
        } else {
          this.invalidFiles.push(new FileInfo(file.name, fileType, file.size, null, file.lastModifiedDate));
        }
      }
    }
  }

  private createFileInfo(reader: FileReader, name: string, type: string, size: number,
    lastUpdated?: Date): FileInfo {
    let fileData: any;
    switch (this._fileDataType) {
      case FileDataType.Base64String:
        fileData = reader.result.split(',')[1];
        break;
      default:
        fileData = reader.result;
    }

    return new FileInfo(name, type, size, fileData, lastUpdated);
  }

  private doDragEnter(e: DragEvent): void {
    // console.log(e.dataTransfer.items);
    if (e.dataTransfer.types.findIndex(t => t === 'Files') < 0) {
      e.dataTransfer.dropEffect = 'none';
    } else {
      if (this.isMultiple || e.dataTransfer.items.length === 1 ) {
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
      if (this.isMultiple || e.dataTransfer.items.length === 1 ) {
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
    const selectedFiles = $event.target.files as FileList;
    this.processFiles(selectedFiles);
  }

  private removeItem(file: FileInfo) {
    const index = this._selectedFiles.findIndex(fi => fi.name === file.name);
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
    const split = file.name.split('.');
    const fileTypeString = split[split.length - 1];
    let fileType = fileTypeString;
    if (this.fileTypeFilter) {
      fileType = this.fileTypeFilter.find(f => f.toUpperCase() === fileTypeString.toUpperCase());
    }
    return fileType;
  }

}
