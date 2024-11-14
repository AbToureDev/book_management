import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Repository } from 'typeorm';
import { PaginateRequest } from './dto/paginate.dto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly httpService: HttpService,
  ) {}
  async create(createBookDto: CreateBookDto) {
    // Creation d'un nouveau livre
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
    //Trouver un livre par
    const book = await this.bookRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: id })
      .getOne();
    // verifie si le livre existe
    if (!book) throw new NotFoundException('Book not found');

    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    // verifie si le livre existe
    const book = await this.findOne(id);

    //mapping du livre avec les nouvelle donne
    book.title = updateBookDto.title;
    book.genre = updateBookDto.genre;
    book.author = updateBookDto.author;
    book.publicationDate = updateBookDto.publicationDate;

    return this.bookRepository.save(book);
  }

  remove(id: string) {
    //Suppression d'un livre existant
    return this.bookRepository.delete(id);
  }

  async findBookByISBN(isbn: string) {
    // if (!/^\d{10}(\d{3})?$/.test(isbn)) {
    //   throw new Error(
    //     'ISBN invalide. Veuillez fournir un ISBN à 10 ou 13 chiffres.',
    //   );
    // }

    try {
      const response = await this.httpService.axiosRef.get(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json`,
      );

      // Vérification si les données de l'API contiennent l'ISBN demandé
      const bookData = response.data[`ISBN:${isbn}`];
      if (!bookData) {
        throw new NotFoundException(`Aucun livre trouvé avec l'ISBN ${isbn}`);
      }

      return bookData;
    } catch (error) {
      // Gestion des erreurs et renvoi d'un message d'erreur
      throw new BadRequestException(`${error.response.message}`);
    }
  }
}
