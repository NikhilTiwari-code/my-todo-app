/**
 * Unit tests for /api/todos route
 * Tests GET (list todos) and POST (create todo) endpoints
 */


import { GET, POST } from '../route';
import { NextResponse } from 'next/server';
import connectToDb from '@/utils/db';
import Todo from '@/models/todos.model';
import { getUserIdFromRequest } from '@/utils/auth';

// Mock dependencies

jest.mock('@/utils/db');
jest.mock('@/models/todos.model');
jest.mock('@/utils/auth');
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ...init,
    })),
  },
}));

describe('GET /api/todos', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserIdFromRequest as jest.Mock).mockResolvedValue({ userId: mockUserId });
    (connectToDb as jest.Mock).mockResolvedValue(undefined);
  });

  it('should return todos with default pagination', async () => {
    const mockTodos = [
      {
        _id: '507f1f77bcf86cd799439012',
        title: 'Test Todo 1',
        description: 'Description 1',
        isCompleted: false,
        owner: mockUserId,
        priority: 'low',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '507f1f77bcf86cd799439013',
        title: 'Test Todo 2',
        description: 'Description 2',
        isCompleted: true,
        owner: mockUserId,
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockFind = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockTodos),
    };

    (Todo.find as jest.Mock).mockReturnValue(mockFind);
    (Todo.countDocuments as jest.Mock).mockResolvedValue(2);

    const request = new Request('http://localhost:3000/api/todos');
    const response = await GET(request);
    const data = await response.json();

    expect(getUserIdFromRequest).toHaveBeenCalledWith(request);
    expect(connectToDb).toHaveBeenCalled();
    expect(Todo.find).toHaveBeenCalledWith({ owner: mockUserId });
    expect(data.data).toEqual(mockTodos);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
      hasMore: false,
    });
  });

  it('should handle pagination parameters', async () => {
    const mockFind = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };

    (Todo.find as jest.Mock).mockReturnValue(mockFind);
    (Todo.countDocuments as jest.Mock).mockResolvedValue(25);

    const request = new Request('http://localhost:3000/api/todos?page=2&limit=5');
    await GET(request);

    expect(mockFind.skip).toHaveBeenCalledWith(5); // (page 2 - 1) * 5
    expect(mockFind.limit).toHaveBeenCalledWith(5);
  });

  it('should filter by isCompleted', async () => {
    const mockFind = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };

    (Todo.find as jest.Mock).mockReturnValue(mockFind);
    (Todo.countDocuments as jest.Mock).mockResolvedValue(0);

    const request = new Request('http://localhost:3000/api/todos?isCompleted=true');
    await GET(request);

    expect(Todo.find).toHaveBeenCalledWith({
      owner: mockUserId,
      isCompleted: true,
    });
  });

  it('should filter by priority', async () => {
    const mockFind = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };

    (Todo.find as jest.Mock).mockReturnValue(mockFind);
    (Todo.countDocuments as jest.Mock).mockResolvedValue(0);

    const request = new Request('http://localhost:3000/api/todos?priority=high');
    await GET(request);

    expect(Todo.find).toHaveBeenCalledWith({
      owner: mockUserId,
      priority: 'high',
    });
  });

  it('should search by title and description', async () => {
    const mockFind = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };

    (Todo.find as jest.Mock).mockReturnValue(mockFind);
    (Todo.countDocuments as jest.Mock).mockResolvedValue(0);

    const request = new Request('http://localhost:3000/api/todos?q=urgent');
    await GET(request);

    expect(Todo.find).toHaveBeenCalledWith({
      owner: mockUserId,
      $or: [
        { title: { $regex: 'urgent', $options: 'i' } },
        { description: { $regex: 'urgent', $options: 'i' } },
      ],
    });
  });

  it('should handle sorting parameters', async () => {
    const mockFind = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };

    (Todo.find as jest.Mock).mockReturnValue(mockFind);
    (Todo.countDocuments as jest.Mock).mockResolvedValue(0);

    const request = new Request('http://localhost:3000/api/todos?sortBy=title&order=asc');
    await GET(request);

    expect(mockFind.sort).toHaveBeenCalledWith({ title: 1 });
  });

  it('should return 401 if user is not authenticated', async () => {
    const errorResponse = NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing Bearer token' } },
      { status: 401 }
    );
    (getUserIdFromRequest as jest.Mock).mockResolvedValue({ error: errorResponse });

    const request = new Request('http://localhost:3000/api/todos');
    const response = await GET(request);

    expect(response).toBe(errorResponse);
    expect(connectToDb).not.toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    const mockFind = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('Database error')),
    };

    (Todo.find as jest.Mock).mockReturnValue(mockFind);

    const request = new Request('http://localhost:3000/api/todos');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_ERROR');
    expect(data.error.message).toBe('Failed to fetch todos');
  });

  it('should enforce maximum limit of 100', async () => {
    const mockFind = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };

    (Todo.find as jest.Mock).mockReturnValue(mockFind);
    (Todo.countDocuments as jest.Mock).mockResolvedValue(0);

    const request = new Request('http://localhost:3000/api/todos?limit=500');
    await GET(request);

    expect(mockFind.limit).toHaveBeenCalledWith(100); // Max limit enforced
  });
});

describe('POST /api/todos', () => {
  const mockUserId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    jest.clearAllMocks();
    (getUserIdFromRequest as jest.Mock).mockResolvedValue({ userId: mockUserId });
    (connectToDb as jest.Mock).mockResolvedValue(undefined);
  });

  it('should create a new todo with valid data', async () => {
    const mockTodo = {
      _id: '507f1f77bcf86cd799439012',
      title: 'New Todo',
      description: 'Todo description',
      isCompleted: false,
      owner: mockUserId,
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439012',
        title: 'New Todo',
        description: 'Todo description',
        isCompleted: false,
        owner: mockUserId,
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      }),
    };

    (Todo as any).mockImplementation(() => mockTodo);

    const requestBody = {
      title: 'New Todo',
      description: 'Todo description',
      priority: 'medium',
    };

    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(getUserIdFromRequest).toHaveBeenCalledWith(request);
    expect(connectToDb).toHaveBeenCalled();
    expect(mockTodo.save).toHaveBeenCalled();
    expect(response.status).toBe(201);
    expect(data.message).toBe('Todo created successfully');
    expect(data.todo.title).toBe('New Todo');
    expect(data.todo.__v).toBeUndefined(); // __v should be removed
  });

  it('should create todo with dueDate', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
    const mockTodo = {
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439012',
        title: 'Todo with date',
        description: 'Description',
        dueDate: new Date(futureDate),
        owner: mockUserId,
        __v: 0,
      }),
    };

    (Todo as any).mockImplementation(() => mockTodo);

    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Todo with date',
        description: 'Description',
        dueDate: futureDate,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.todo.dueDate).toBeDefined();
  });

  it('should return 400 if title is missing', async () => {
    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Description',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toBe('Title is required');
  });

  it('should return 400 if title is empty string', async () => {
    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: '   ',
        description: 'Description',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toBe('Title is required');
  });

  it('should return 400 if description is missing', async () => {
    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Title',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toBe('Description is required');
  });

  it('should return 400 if priority is invalid', async () => {
    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Title',
        description: 'Description',
        priority: 'urgent', // Invalid: should be low/medium/high
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toBe('Priority must be one of: low, medium, high');
  });

  it('should return 400 if dueDate is invalid format', async () => {
    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Title',
        description: 'Description',
        dueDate: 'not-a-date',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toBe('Invalid dueDate format');
  });

  it('should return 400 if dueDate is in the past', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday

    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Title',
        description: 'Description',
        dueDate: pastDate,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toBe('dueDate must be in the future');
  });

  it('should return 401 if user is not authenticated', async () => {
    const errorResponse = NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing Bearer token' } },
      { status: 401 }
    );
    (getUserIdFromRequest as jest.Mock).mockResolvedValue({ error: errorResponse });

    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Title',
        description: 'Description',
      }),
    });

    const response = await POST(request);

    expect(response).toBe(errorResponse);
    expect(connectToDb).not.toHaveBeenCalled();
  });

  it('should handle mongoose validation errors', async () => {
    const mockTodo = {
      save: jest.fn().mockRejectedValue({
        name: 'ValidationError',
        message: 'Mongoose validation failed',
      }),
    };

    (Todo as any).mockImplementation(() => mockTodo);

    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Title',
        description: 'Description',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toBe('Mongoose validation failed');
  });

  it('should handle database errors', async () => {
    const mockTodo = {
      save: jest.fn().mockRejectedValue(new Error('Database connection failed')),
    };

    (Todo as any).mockImplementation(() => mockTodo);

    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Title',
        description: 'Description',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_ERROR');
    expect(data.error.message).toBe('Failed to create todo');
  });

  it('should trim whitespace from title and description', async () => {
    const mockTodo = {
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439012',
        title: 'Trimmed Title',
        description: 'Trimmed Description',
        owner: mockUserId,
        __v: 0,
      }),
    };

    let capturedData: any;
    (Todo as any).mockImplementation((data: any) => {
      capturedData = data;
      return mockTodo;
    });

    const request = new Request('http://localhost:3000/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        title: '  Trimmed Title  ',
        description: '  Trimmed Description  ',
      }),
    });

    await POST(request);

    expect(capturedData.title).toBe('Trimmed Title');
    expect(capturedData.description).toBe('Trimmed Description');
  });
});
