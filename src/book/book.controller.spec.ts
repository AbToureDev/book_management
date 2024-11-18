import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { v4 as uuidv4 } from 'uuid';
import { PaginateRequest } from './dto/paginate.dto';

describe('BookController', () => {
  let controller: BookController;

  const bookMock = [
    {
      id: '66b210389595c3c53f28c87d',
      title: 'New Book',
      author: 'Author',
      publicationDate: new Date('2024-11-14'),
      genre: 'Fantastic',
    },
  ];
  const singleBook = {
    id: '8cda8614-df20-4d71-ac41-65ee02118130',
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

  const mockBookService = {
    create: jest.fn().mockImplementation((dto) => {
      return {
        id: uuidv4(),
        ...dto,
      };
    }),
    findAll: jest.fn(),
    findOne: jest.fn().mockImplementation((id: string) => {
      return Promise.resolve(singleBook);
    }),
    update: jest.fn().mockImplementation((id, dto) => ({
      id,
      ...dto,
    })),
    remove: jest.fn().mockResolvedValue({ message: 'book deleted' }),

    findBookByISBN: jest.fn(),
    getBookRating: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [BookService],
      // providers: [{ provide: BookService, useValue: mockBookService }],
    })
      .overrideProvider(BookService)
      .useValue(mockBookService)
      .compile();

    controller = module.get<BookController>(BookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a new BookController', () => {
    expect(
      controller.create({
        title: 'New Book',
        author: 'Author',
        publicationDate: new Date('2024-11-14'),
        genre: 'Fantastic',
      }),
    ).toEqual({
      id: expect.any(String),
      title: 'New Book',
      author: 'Author',
      publicationDate: new Date('2024-11-14'),
      genre: 'Fantastic',
    });
    expect(mockBookService.create).toHaveBeenCalledWith(bookDto);
  });

  it('should return paginated books', async () => {
    // Defenition de filtre envoye
    const params: PaginateRequest = {
      page: 1,
      limit: 10,
      author: 'toure',
      genre: 'History',
      publicationDate: new Date('2022-06-04'),
    };
    //Initialisation du total page total et page courante
    const total = 20;
    const totalPages = 2;
    const currentPage = 1;
    mockBookService.findAll.mockResolvedValue([
      bookMock,
      total,
      totalPages,
      currentPage,
    ]);

    const result = await controller.findAll(params);

    expect(mockBookService.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual({
      books: bookMock,
      current_page: currentPage,
      total_pages: totalPages,
      total_results: total,
    });
  });

  it('should show single book', () => {
    const _id = '8cda8614-df20-4d71-ac41-65ee02118130';
    const dto = {
      id: _id,
      ...bookDto,
    };
    expect(controller.findOne(_id)).resolves.toEqual(dto);
  });

  it('should update book', () => {
    expect(
      controller.update('23871837-ecfe-40b4-8918-5a4d045eff01', bookDto),
    ).toEqual({
      id: '23871837-ecfe-40b4-8918-5a4d045eff01',
      ...bookDto,
    });
    expect(mockBookService.update).toHaveBeenCalled();
  });
  it('should delete book', () => {
    const _id = uuidv4();
    expect(controller.remove(_id)).resolves.toEqual({
      message: 'book deleted',
    });
  });

  it('should return external book by ISBN', async () => {
    const isbn = '4321654389';
    const book = {
      bib_key: 'ISBN:0201558025',
      info_url: 'https://openlibrary.org/books/OL1429049M/Concrete_mathematics',
      preview: 'full',
      preview_url: 'https://archive.org/details/concretemathemat00grah_444',
      thumbnail_url: 'https://covers.openlibrary.org/b/id/135182-S.jpg',
    };
    mockBookService.findBookByISBN.mockResolvedValue(book);

    const result = await mockBookService.findBookByISBN(isbn);

    expect(mockBookService.findBookByISBN).toHaveBeenCalledWith(isbn);
    expect(result).toEqual(book);
  });

  it('should return rating for a book by ID', async () => {
    const _id = '24690473-c9e8-44c4-9fb7-162f15ecb899';
    const mockRating = {
      message: `Book score.`,
      score: 8.5,
      score_rounded: 9,
    };
    mockBookService.getBookRating.mockResolvedValue(mockRating);
    const result = await controller.getBookRating(_id);
    expect(mockBookService.getBookRating).toHaveBeenCalledWith(_id);
    expect(result).toEqual(mockRating);
  });
});
