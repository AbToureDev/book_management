import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class PaginateRequest {
  @ApiProperty({ description: 'Page number', example: 1, required: true })
  @IsNotEmpty()
  page?: number;

  @ApiProperty({
    description: 'Results per page limit',
    example: 10,
    required: true,
  })
  @IsNotEmpty()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Book author',
    example: 'toure',
    required: false,
  })
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({
    description: 'Book genre',
    example: 'History',
    required: false,
  })
  @IsOptional()
  genre?: string;

  @ApiPropertyOptional({
    // description: 'Book publication date',
    // example: '2022/06/4',
    required: false,
  })
  @IsOptional()
  publicationDate?: Date;
}
