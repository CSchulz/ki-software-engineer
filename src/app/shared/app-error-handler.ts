import { ErrorHandler, Injectable } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  constructor(private readonly toast: ToastService) {}

  handleError(error: unknown): void {
    console.error('Unexpected application error', error);
    this.toast.show('Something went wrong. Please try again.');
  }
}
