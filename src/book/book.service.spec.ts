import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { HttpService } from '@nestjs/axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { v4 as uuidv4 } from 'uuid';
import { PaginateRequest } from './dto/paginate.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BookService', () => {
  let service: BookService;

  const booksMock = [
    {
      id: '66b210389595c3c53f28c87d',
      title: 'New Book',
      author: 'Author',
      publicationDate: new Date('2024-11-14'),
      genre: 'Fantastic',
    },
  ];
  const singleBook = {
    id: expect.any(String),
    title: 'New Book',
    author: 'Author',
    publicationDate: new Date('2024-11-14'),
    genre: 'Fantastic',
  };
  const bookDto = {
    title: 'New Book',
    author: 'Author',
    publicationDate: new Date('2024-11-14'),
    genre: 'Fantastic',
  };

  const mockBookRepository = {
    create: jest.fn().mockImplementation((dto) => dto),

    save: jest.fn().mockImplementation((dto) => {
      return {
        id: uuidv4(),
        ...dto,
      };
    }),
    findAll: jest.fn(),

    findOne: jest.fn(),

    update: jest.fn().mockImplementation((id, dto) => ({
      id,
      ...dto,
    })),
    remove: jest.fn(),
    delete: jest.fn(),

    findBookByISBN: jest.fn(),

    getBookRating: jest.fn(),

    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([booksMock, booksMock.length]),
      getOne: jest.fn().mockResolvedValue(singleBook),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: getRepositoryToken(Book),
          useValue: mockBookRepository,
        },
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBook', () => {
    it('should create a new book record and return that', async () => {
      const result = await service.create(bookDto);
      expect(result).toEqual(singleBook);
    });
  });

  describe('find All book', () => {
    const mockParams: PaginateRequest = {
      genre: 'Science Fiction',
      author: 'John Doe',
      publicationDate: new Date('2024-01-01'),
      page: 1,
      limit: 10,
    };
    it('should get all book with params', async () => {
      const result = await service.findAll(mockParams);
      expect(mockBookRepository.createQueryBuilder).toHaveBeenCalledWith(
        'book',
      );
      expect(result).toEqual([booksMock, booksMock.length, 1, 1]);
    });

    it('should throw BadRequestException if publicationDate is invalid', async () => {
      const mockParamsInv: PaginateRequest = {
        genre: 'Science Fiction',
        author: 'John Doe',
        publicationDate: new Date('invalid-date'), // Date invalide
        page: 1,
        limit: 10,
      };
      await expect(service.findAll(mockParamsInv)).rejects.toThrow(
        new BadRequestException('La date de publication fournie est invalide'),
      );
    });
  });

  describe('findOne', () => {
    it('should return a book if found', async () => {
      const result = await service.findOne(singleBook.id);
      expect(mockBookRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual(singleBook);
    });

    it('should throw NotFoundException if book not found', async () => {
      mockBookRepository.createQueryBuilder.mockImplementationOnce(() => ({
        getManyAndCount: undefined,
        skip: undefined,
        take: undefined,
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(undefined),
      }));
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockBookRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should successfully update a book if it exists', async () => {
      const updateBookDto = {
        title: 'Updated Title',
        genre: 'Updated Genre',
        author: 'Updated Author',
        publicationDate: new Date('2024-01-01'),
      };
      const result = await service.update(singleBook.id, updateBookDto);

      expect(result).toEqual({
        ...singleBook,
        ...updateBookDto, // Vérifie que le livre mis à jour est retourné correctement
      });
    });
  });

  describe('Delete book', () => {
    it('should successfully remove a book if it exists', async () => {
      // Mock de la méthode delete pour un succès
      mockBookRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(singleBook.id);

      expect(mockBookRepository.delete).toHaveBeenCalledWith(singleBook.id);
      expect(result).toEqual({ affected: 1 });
    });

    it('should return an error if the book does not exist', async () => {
      // Mock de la méthode delete pour un échec
      mockBookRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.remove('invalid-id');

      expect(mockBookRepository.delete).toHaveBeenCalledWith('invalid-id');
      expect(result).toEqual({ affected: 0 });
    });
  });

  describe('findBookByISBN', () => {
    const mockISBN = '9781234567890';
    const mockBookData = {
      title: 'Mocked Book',
      author: 'Mocked Author',
      publicationDate: '2024-01-01',
    };

    it('should return book data when a valid ISBN is provided and the book exists', async () => {
      // Mock de l'API retournant des données
      jest.spyOn(service['httpService'].axiosRef, 'get').mockResolvedValue({
        data: { [`ISBN:${mockISBN}`]: mockBookData },
      });

      const result = await service.findBookByISBN(mockISBN);

      expect(service['httpService'].axiosRef.get).toHaveBeenCalledWith(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${mockISBN}&format=json`,
      );
      expect(result).toEqual(mockBookData);
    });

    it('should throw NotFoundException if no data is found for the ISBN', async () => {
      // Mock de l'API ne retournant aucune donnée pour l'ISBN
      jest.spyOn(service['httpService'].axiosRef, 'get').mockResolvedValue({
        data: {},
      });

      await expect(service.findBookByISBN(mockISBN)).rejects.toThrow(
        `Aucun livre trouvé avec l'ISBN ${mockISBN}`,
      );

      expect(service['httpService'].axiosRef.get).toHaveBeenCalledWith(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${mockISBN}&format=json`,
      );
    });

    it('should throw BadRequestException if the API call fails', async () => {
      // Mock de l'API levant une erreur
      jest.spyOn(service['httpService'].axiosRef, 'get').mockRejectedValue({
        response: { message: 'API error' },
      });

      await expect(service.findBookByISBN(mockISBN)).rejects.toThrow(
        BadRequestException,
      );

      expect(service['httpService'].axiosRef.get).toHaveBeenCalledWith(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${mockISBN}&format=json`,
      );
    });
  });

  describe('Rating book', () => {
    const mockId = '24690473-c9e8-44c4-9fb7-162f15ecb899';
    const mockRating = {
      message: `Book score.`,
      score: 8.5,
      score_rounded: 9,
    };

    it('should return book rating', async () => {
      const result = await service.getBookRating(mockId);
      expect(result).toEqual(mockRating);
    });
  });
});
