import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { StreamableFile } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PermissionGuard } from "src/global/guards/permission.guard";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";
import { JwtAuthGuard } from "src/global/guards/jwt-auth.guard";
import { Reflector } from "@nestjs/core";
import { CHECK_PERMISSIONS_KEY } from "src/global/tokens/check-permission.token";
import { Response } from "express";
import { ConfigService } from "@nestjs/config";

describe("DocumentController", () => {
  let controller: DocumentController;
  let service: DeepMocked<DocumentService>;
  let reflect: Reflector;
  let config: DeepMocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        Reflector,
        {
          provide: DocumentService,
          useValue: createMock<DocumentService>(),
        },
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
          }),
        },
      ],
    })
      .overrideGuard(PermissionGuard)
      .useValue(createMock<PermissionGuard>())
      .overrideGuard(JwtAuthGuard)
      .useValue(createMock<JwtAuthGuard>())
      .compile();

    controller = module.get<DocumentController>(DocumentController);
    service = module.get(DocumentService);
    reflect = module.get(Reflector);
    config = module.get(ConfigService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should have auth for createDocument", () => {
    const handlers = reflect.get(
      CHECK_PERMISSIONS_KEY,
      controller.createDocument,
    );
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should create a document", async () => {
    const mockFile = {
      originalname: "test.txt",
      filename: "test-123.txt",
      mimetype: "text/plain",
      path: "uploads/test-123.txt",
    };

    const mockResponse = {
      message: "Document created successfully",
      document: {
        id: 1,
        name: "test.txt",
        mimeType: "text/plain",
      },
    };

    service.create.mockResolvedValue(mockResponse);

    const result = await controller.createDocument(mockFile as any);

    expect(service.create).toHaveBeenCalledWith(mockFile);
    expect(result).toEqual(mockResponse);
  });

  it("should have auth for getDocumentById", () => {
    const handlers = reflect.get(
      CHECK_PERMISSIONS_KEY,
      controller.getDocumentById,
    );
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should get a document by id", async () => {
    const mockFile = {
      originalname: "test.txt",
      filename: "test-123.txt",
      mimetype: "text/plain",
      path: "uploads/test-123.txt",
    };

    const mockDocument = {
      id: 1,
      originalName: "test.txt",
      mimeType: "text/plain",
      path: "uploads/test-123.txt",
    };

    const mockStream = {
      pipe: jest.fn(),
      on: jest.fn(),
      destroy: jest.fn(),
    } as any;

    const mockResponse = {
      set: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    service.getDocumentById.mockResolvedValue(mockDocument as any);
    service.retrieveDocument.mockResolvedValue(mockStream);

    const result = await controller.getDocumentById(1, mockResponse);

    expect(service.getDocumentById).toHaveBeenCalledWith(1);
    expect(service.retrieveDocument).toHaveBeenCalledWith(1);
    expect(mockResponse.set).toHaveBeenCalledWith({
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="${mockDocument.originalName}"`,
    });
    expect(result).toBeInstanceOf(StreamableFile);
  });

  it("should have auth for updateDocument", () => {
    const handlers = reflect.get(
      CHECK_PERMISSIONS_KEY,
      controller.updateDocument,
    );
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should update a document", async () => {
    const mockFile = {
      originalname: "new.txt",
      filename: "new-123.txt",
      mimetype: "text/plain",
      path: "uploads/new-123.txt",
    };

    service.updateDocument.mockResolvedValue(undefined);

    const result = await controller.updateDocument(1, mockFile as any);

    expect(service.updateDocument).toHaveBeenCalledWith(1, mockFile);
    expect(result).toEqual({
      message: "Document updated",
    });
  });

  it("should have auth for deleteDocument", () => {
    const handlers = reflect.get(
      CHECK_PERMISSIONS_KEY,
      controller.deleteDocument,
    );
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should delete a document", async () => {
    service.deleteDocument.mockResolvedValue(undefined);

    const result = await controller.deleteDocument(1);

    expect(service.deleteDocument).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      message: "Document deleted",
    });
  });

  it("should have auth for listDocuments", () => {
    const handlers = reflect.get(
      CHECK_PERMISSIONS_KEY,
      controller.listDocuments,
    );
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should list all documents", async () => {
    const mockDocuments = [
      { id: 1, name: "doc1.txt", path: "path1", size: "1 KB" },
      { id: 2, name: "doc2.txt", path: "path2", size: "2 KB" },
    ];

    service.listDocuments.mockResolvedValue(mockDocuments as any);

    const result = await controller.listDocuments();

    expect(service.listDocuments).toHaveBeenCalled();
    expect(result).toEqual(mockDocuments);
  });
});
