import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    // For now, no DB. Just prove validation works.
    // throw new Error('boom');
    return {
      message: 'User accepted',
      data: dto,
    };
  }
}
