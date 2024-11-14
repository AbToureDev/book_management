import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Repository } from 'typeorm';
import { PaginateRequest } from './dto/paginate.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}
  async create(createBookDto: CreateBookDto) {
    return await this.bookRepository.save(createBookDto);
  }

  async findAll(params: PaginateRequest) {
    const { genre, author, publicationDate, page, limit } = params;
    // Conversion des paramètres de pagination en nombr
    const pagination: PaginateRequest = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };
    // Calcul de l'offset pour la pagination
    const skip = (pagination.page - 1) * pagination.limit;
    let query = this.bookRepository.createQueryBuilder('book');

    // Filtrage par genre
    if (genre) {
      query = query.where('book.genre ILIKE :genre', {
        genre: `%${genre}%`,
      });
    }

    // Filtrage par auteur
    if (author) {
      query = query.andWhere('book.author ILIKE :author', {
        author: `%${author}%`,
      });
    }

    if (publicationDate) {
      const publicationDateObj = new Date(publicationDate);
      // Vérification si la date est valide
      if (!isNaN(publicationDateObj.getTime())) {
        query = query.andWhere('book.publicationDate = :publicationDate', {
          publicationDate: publicationDateObj,
        });
      } else {
        throw new Error('La date de publication fournie est invalide');
      }
    }

    // Exécution de la requête avec pagination
    const [books, total] = await query
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    // Calcul du nombre total de pages
    const totalPages = Math.ceil(total / pagination.limit);
    return [books, total, totalPages, pagination.page];
  }

  async findOne(id: string) {
    const book = await this.bookRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: id })
      .getOne();

    if (!book) throw new NotFoundException('Book not found');

    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    const book = await this.findOne(id);
    book.title = updateBookDto.title;
    book.genre = updateBookDto.genre;
    book.author = updateBookDto.author;
    book.publicationDate = updateBookDto.publicationDate;

    return this.bookRepository.save(book);
  }

  remove(id: string) {
    return this.bookRepository.delete(id);
  }
}
