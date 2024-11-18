import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { PaginateRequest } from './dto/paginate.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('book')
@ApiTags('BooK')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new book' })
  create(@Body() createBookDto: CreateBookDto) {
    return this.bookService.create(createBookDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all books with filter' })
  async findAll(@Query() params: PaginateRequest) {
    const [books, total, totalPages, currentPage] =
      await this.bookService.findAll(params);
    return {
      books,
      current_page: currentPage,
      total_pages: totalPages,
      total_results: total,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find book by id' })
  findOne(@Param('id') id: string) {
    return this.bookService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update book' })
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.bookService.update(id, updateBookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book' })
  remove(@Param('id') id: string) {
    return this.bookService.remove(id);
  }

  @Get(':id/rating')
  async getBookRating(@Param('id') id: string) {
    return await this.bookService.getBookRating(id);
  }

  @Get('find_book_by_iSBN/:isbn')
  @ApiOperation({
    summary:
      'Find book by isbn, with external api in exemple le isbn:0201558025',
  })
  findBookByISBN(@Param('isbn') isbn: string) {
    return this.bookService.findBookByISBN(isbn);
  }
}
