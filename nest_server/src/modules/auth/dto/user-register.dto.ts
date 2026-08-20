import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class UserRegisterDto extends OmitType(CreateUserDto, ['status'] as const) {}
