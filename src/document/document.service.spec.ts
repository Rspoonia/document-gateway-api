import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { DocumentService } from "./document.service";
import { DocumentEntity } from "./entities/document.entity";
import { convertBytes } from "./utils/convertByte";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";

jest.mock("./utils/convertByte", () => ({
  convertBytes: jest.fn(),
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
          provide: getRepositoryToken(DocumentEntity),
          useValue: {
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
          },
        },
      ],
    }).compile();

    config = module.get(ConfigService);
    service = module.get<DocumentService>(DocumentService);
    repo = module.get(getRepositoryToken(DocumentEntity));

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
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
  });

  describe("getDocumentById", () => {
    it("should return document when found", async () => {
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

    it("should throw NotFoundException when document not found", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.getDocumentById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("retrieveDocument", () => {
    it("should return a read stream for the document", async () => {
      const mockDocument = {
        id: 1,
        originalName: "test.txt",
        name: "test-123.txt",
        mimeType: "text/plain",
        path: "uploads/test-123.txt",
        uploadedAt: new Date(),
      };

      repo.findOne.mockResolvedValue(mockDocument);
      jest.spyOn(fs, 'createReadStream').mockReturnValue({
        pipe: jest.fn(),
      } as any);

      const result = await service.retrieveDocument(1);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(fs.createReadStream).toHaveBeenCalledWith(
        path.join(process.cwd(), 'uploads', mockDocument.name)
      );
      expect(result).toBeDefined();
    });

    it("should throw NotFoundException when document not found", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.retrieveDocument(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateDocument", () => {
    it("should update document and delete old file", async () => {
      const mockFile = {
        originalname: "updated.txt",
        filename: "updated-123.txt",
        mimetype: "text/plain",
        path: path.join(process.cwd(), "uploads", "updated-123.txt"),
      };

      const existingDocument = {
        id: 1,
        originalName: "test.txt",
        name: "test-123.txt",
        mimeType: "text/plain",
        path: path.join(process.cwd(), "uploads", "test-123.txt"),
        uploadedAt: new Date(),
      };

      repo.findOne.mockResolvedValue(existingDocument);
      repo.save.mockResolvedValue({ ...existingDocument, ...mockFile });
      jest.spyOn(fsPromises, 'rm').mockResolvedValue(undefined);

      await service.updateDocument(1, mockFile as any);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
        originalName: mockFile.originalname,
        name: mockFile.filename,
        mimeType: mockFile.mimetype,
      }));
      expect(fsPromises.rm).toHaveBeenCalledWith(
        path.join(process.cwd(), "uploads", "test-123.txt")
      );
    });

    it("should throw NotFoundException when document not found", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.updateDocument(1, {} as any)).rejects.toThrow(NotFoundException);
    });

    it("should clean up new file if update fails", async () => {
      const mockFile = {
        originalname: "updated.txt",
        filename: "updated-123.txt",
        mimetype: "text/plain",
        path: path.join(process.cwd(), "uploads", "updated-123.txt"),
      };

      const existingDocument = {
        id: 1,
        originalName: "test.txt",
        name: "test-123.txt",
        mimeType: "text/plain",
        path: "uploads/test-123.txt",
        uploadedAt: new Date(),
      };

      repo.findOne.mockResolvedValue(existingDocument);
      repo.save.mockRejectedValue(new Error("Save failed"));
      jest.spyOn(fsPromises, 'rm').mockResolvedValue(undefined);

      await expect(service.updateDocument(1, mockFile as any)).rejects.toThrow("Save failed");
      expect(fsPromises.rm).toHaveBeenCalledWith(mockFile.path);
    });
  });

  describe("deleteDocument", () => {
    it("should delete document and its file", async () => {
      const mockDocument = {
        id: 1,
        originalName: "test.txt",
        name: "test-123.txt",
        mimeType: "text/plain",
        path: "uploads/test-123.txt",
        uploadedAt: new Date(),
      };

      repo.findOne.mockResolvedValue(mockDocument);
      repo.remove.mockResolvedValue(mockDocument);
      jest.spyOn(fsPromises, 'rm').mockResolvedValue(undefined);

      await service.deleteDocument(1);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repo.remove).toHaveBeenCalledWith(mockDocument);
      expect(fsPromises.rm).toHaveBeenCalledWith(
        path.join(process.cwd(), 'uploads', mockDocument.name)
      );
    });

    it("should throw NotFoundException when document not found", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.deleteDocument(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("getSizeOfDocument", () => {
    it("should return document size", async () => {
      const mockStats = {
        size: 1024,
      };

      jest.spyOn(fsPromises, 'stat').mockResolvedValue(mockStats as any);
      (convertBytes as jest.Mock).mockReturnValue("1 KB");

      const result = await service.getSizeOfDocument("test.txt");

      expect(fsPromises.stat).toHaveBeenCalledWith("test.txt");
      expect(convertBytes).toHaveBeenCalledWith(1024);
      expect(result).toBe("1 KB");
    });
  });

  describe("listDocuments", () => {
    it("should return all documents", async () => {
      const mockDocuments = [
        {
          id: 1,
          originalName: "test1.txt",
          name: "test1-123.txt",
          mimeType: "text/plain",
          path: "uploads/test1-123.txt",
          uploadedAt: new Date(),
        },
        {
          id: 2,
          originalName: "test2.txt",
          name: "test2-123.txt",
          mimeType: "text/plain",
          path: "uploads/test2-123.txt",
          uploadedAt: new Date(),
        },
      ];

      repo.find.mockResolvedValue(mockDocuments);
      jest.spyOn(fsPromises, 'stat').mockResolvedValue({ size: 1024 } as any);
      (convertBytes as jest.Mock).mockReturnValue("1 KB");

      const result = await service.listDocuments();

      expect(repo.find).toHaveBeenCalled();
      expect(result).toEqual(mockDocuments.map(doc => ({
        id: doc.id,
        name: doc.originalName,
        size: "1 KB",
        uploadedAt: doc.uploadedAt,
      })));
    });
  });
});
