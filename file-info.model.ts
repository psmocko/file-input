export class FileInfo {
    name: string;
    type: string;
    size: number;
    data: string;
    lastUpdated?: Date;

    get fileSizeString(): string {
        if (this.size) {
            if(this.size < 1024) {
                return '(' + this.size + ')' + 'bytes';
            } else if(this.size > 1024 && this.size < 1048576) {
                return '(' + (this.size/1024).toFixed(1) + ')' + 'KB';
            } else if(this.size > 1048576) {
                return '(' + (this.size/1048576).toFixed(1) + ')' + 'MB';
            }
        }
        return '(0)bytes';
    }

    constructor(name: string, type: string, size: number, data: string, lastUpdated?: Date) {        
        this.name = name;
        this.type = type,
        this.size = size;
        this.data = data,
        this.lastUpdated = lastUpdated;
    }
}