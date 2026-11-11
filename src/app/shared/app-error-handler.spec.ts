import { AppErrorHandler } from './app-error-handler';
import { ToastService } from './toast.service';

describe('AppErrorHandler', () => {
  it('reports unexpected errors through the shared user-facing error channel', () => {
    const toast = jasmine.createSpyObj<ToastService>('ToastService', ['show']);
    const consoleError = spyOn(console, 'error');
    const handler = new AppErrorHandler(toast);
    const error = new Error('unexpected');

    handler.handleError(error);

    expect(consoleError).toHaveBeenCalledWith('Unexpected application error', error);
    expect(toast.show).toHaveBeenCalledWith('Something went wrong. Please try again.');
  });
});
