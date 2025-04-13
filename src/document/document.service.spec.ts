import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import * as nodeFs from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import { DocumentService } from "./document.service";
import { DocumentEntity } from "./entities/document.entity";
import { convertBytes } from "./utils/convertByte";
import { Repository } from "typeorm";

// Mock interfaces and types from typeorm
const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findOneBy: jest.fn(),
  findOneByOrFail: jest.fn(),
  findOneOrFail: jest.fn(),
  findAndCount: jest.fn(),
  findAndCountBy: jest.fn(),
  findBy: jest.fn(),
  findByIds: jest.fn(),
  count: jest.fn(),
  countBy: jest.fn(),
  exists: jest.fn(),
  existsBy: jest.fn(),
  createQueryBuilder: jest.fn(),
  query: jest.fn(),
  clear: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  softRemove: jest.fn(),
  recover: jest.fn(),
  insert: jest.fn(),
  manager: {
    transaction: jest.fn(),
  },
  metadata: {
    columns: [],
    relations: [],
    indices: [],
    uniques: [],
    checks: [],
    exclusions: [],
    ownColumns: [],
    ownRelations: [],
    ownIndices: [],
    ownUniques: [],
    ownChecks: [],
    ownExclusions: [],
    columnsMap: {},
    relationsMap: {},
    indicesMap: {},
    uniquesMap: {},
    checksMap: {},
    exclusionsMap: {},
    ownColumnsMap: {},
    ownRelationsMap: {},
    ownIndicesMap: {},
    ownUniquesMap: {},
    ownChecksMap: {},
    ownExclusionsMap: {},
    tableName: "documents",
    target: DocumentEntity,
    name: "DocumentEntity",
    type: "regular",
    orderBy: null,
    engine: null,
    database: null,
    schema: null,
    synchronize: true,
    withoutRowid: false,
    isJunction: false,
    isClosureJunction: false,
    hasMultiplePrimaryKeys: false,
    hasUUIDGeneratedColumns: false,
    treeType: null,
    treeOptions: null,
    discriminatorValue: null,
    inheritanceType: "none",
    inheritanceTree: [],
    inheritancePattern: null,
    parentEntityMetadata: null,
    parentClosureEntityMetadata: null,
    tableMetadataArgs: null,
    expression: null,
  },
  native: {
    query: jest.fn(),
  },
} as unknown as Repository<DocumentEntity>);

jest.mock("./utils/convertByte", () => ({
  convertBytes: jest.fn(),
}));

jest.mock("fs/promises", () => ({
  rm: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn(),
}));

jest.mock("fs", () => ({
  createReadStream: jest.fn(),
}));

describe("DocumentService", () => {
  let service: DocumentService;
  let config: DeepMocked<ConfigService>;
  let repo: DeepMocked<Repository<DocumentEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        { 
          provide: ConfigService, 
          useValue: createMock<ConfigService>({
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'UPLOAD_PATH':
                  return 'uploads';
                case 'UPLOAD_MAX_FILE_SIZE':
                  return '1048576';
                default:
                  return undefined;
              }
            })
          }) 
        },
        {
          provide: 'DocumentEntityRepository',
          useValue: mockRepository(),
        },
      ],
    }).compile();

    config = module.get(ConfigService);
    service = module.get<DocumentService>(DocumentService);
    repo = module.get('DocumentEntityRepository');

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a document", async () => {
    const mockFile = {
      originalname: "test.txt",
      filename: "test-123.txt",
      mimetype: "text/plain",
      path: path.join(process.cwd(), "uploads", "test-123.txt"),
    };

    const savedDocument = {
      id: 1,
      originalName: "test.txt",
      name: "test-123.txt",
      mimeType: "text/plain",
      path: mockFile.path,
      uploadedAt: new Date(),
    };

    repo.save.mockResolvedValue(savedDocument);

    const result = await service.create(mockFile as any);

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      originalName: mockFile.originalname,
      name: mockFile.filename,
      mimeType: mockFile.mimetype,
      path: mockFile.path,
    }));
    expect(result).toEqual({
      message: 'Document created successfully',
      document: {
        id: savedDocument.id,
        name: savedDocument.originalName,
        mimeType: savedDocument.mimeType,
      },
    });
  });

  it("should get a document by id", async () => {
    const mockDocument = {
      id: 1,
      originalName: "test.txt",
      name: "test-123.txt",
      mimeType: "text/plain",
      path: "uploads/test-123.txt",
      uploadedAt: new Date(),
    };

    repo.findOne.mockResolvedValue(mockDocument);

    const result = await service.getDocumentById(1);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(mockDocument);
  });

  it("should throw NotFoundException if document not found", async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.getDocumentById(1)).rejects.toThrow(NotFoundException);
  });

  it("should retrieve a document by id", async () => {
    const mockReadStream = { pipe: jest.fn() };
    (nodeFs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);
    
    const document = {
      name: "test-123.txt",
      path: path.join(process.cwd(), "uploads", "test-123.txt"),
      uploadedAt: new Date(),
    } as any;

    repo.findOne.mockResolvedValue(document);

    const readStream = await service.retrieveDocument(1);

    expect(repo.findOne).toHaveBeenCalledTimes(1);
    expect(nodeFs.createReadStream).toHaveBeenCalledWith(document.path);
    expect(readStream).toBeDefined();
  });

  it("should update a document", async () => {
    const mockFile = {
      originalname: "new.txt",
      filename: "new-123.txt",
      mimetype: "text/plain",
      path: path.join(process.cwd(), "uploads", "new-123.txt"),
    };

    const existingDocument = {
      id: 1,
      name: "old.txt",
      path: path.join(process.cwd(), "uploads", "old.txt"),
      uploadedAt: new Date(),
    } as any;

    (fs.rm as jest.Mock).mockResolvedValue(undefined);
    repo.findOne.mockResolvedValue(existingDocument);
    repo.save.mockResolvedValue({
      id: 1,
      originalName: "new.txt",
      name: "new-123.txt",
      mimeType: "text/plain",
      path: mockFile.path,
      uploadedAt: new Date(),
    });

    await service.updateDocument(1, mockFile as any);

    expect(fs.rm).toHaveBeenCalledWith(existingDocument.path);
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      originalName: mockFile.originalname,
      name: mockFile.filename,
      mimeType: mockFile.mimetype,
      path: mockFile.path,
    }));
  });

  it("should delete a document", async () => {
    const document = {
      id: 1,
      name: "test.txt",
      path: path.join(process.cwd(), "uploads", "test.txt"),
      uploadedAt: new Date(),
    } as any;

    repo.findOne.mockResolvedValue(document);
    (fs.rm as jest.Mock).mockResolvedValue(undefined);
    repo.remove.mockResolvedValue({} as any);

    await service.deleteDocument(1);

    expect(fs.rm).toHaveBeenCalledWith(document.path);
    expect(repo.remove).toHaveBeenCalledWith(document);
  });

  it("should list all documents", async () => {
    const documents = [
      { id: 1, name: "doc1.txt", path: "path1", uploadedAt: new Date() },
      { id: 2, name: "doc2.txt", path: "path2", uploadedAt: new Date() },
    ] as any[];

    repo.find.mockResolvedValue(documents);
    (fs.stat as jest.Mock).mockResolvedValue({ size: 1024 });
    (convertBytes as jest.Mock).mockReturnValue("1 KB");

    const result = await service.listDocuments();

    expect(repo.find).toHaveBeenCalledTimes(1);
    expect(fs.stat).toHaveBeenCalledTimes(2);
    expect(convertBytes).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });
});
