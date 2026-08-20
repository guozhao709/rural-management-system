import { SetMetadata } from '@nestjs/common';
import { RESPONSE_MESSAGE_KEY } from '../constants/http.constants';

export const ResponseMessage = (message: string): MethodDecorator & ClassDecorator =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
