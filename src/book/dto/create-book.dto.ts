import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
  @IsNotEmpty({ message: 'Please enter book title' })
  @ApiProperty({
    default: 'La vie de mouna',
  })
  title: string;

  @IsNotEmpty({ message: 'Please enter book author name' })
  @ApiProperty({
    default: 'Toure Aboubacar',
  })
  author: string;

  @IsNotEmpty({ message: 'Please enter publication date' })
  @ApiProperty({ default: '2024-11-14' })
  publicationDate: Date;

  @IsNotEmpty({ message: 'Please enter book genre' })
  @ApiProperty({
    default: 'histoire',
  })
  genre: string;
}
