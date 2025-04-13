/* eslint-disable no-undef */
import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { createReadStream, readFileSync } from "fs";
import { rm, stat } from "fs/promises";
import { join } from "path";
import { Repository } from "typeorm";
import { DocumentEntity } from "./entities/document.entity";
import { convertBytes } from "./utils/convertByte";

@Injectable()
export class DocumentService {
  private uploadPath: string;

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    private readonly configService: ConfigService,
  ) {
    this.uploadPath = join(process.cwd(), 'uploads');
  }

  /**
   * saves the document entry and uploaded file
   * @param document the newly uploaded document
   * @returns void
   */
  async create(document: Express.Multer.File) {
    const newDocument = new DocumentEntity();
    newDocument.originalName = document.originalname;
    newDocument.name = document.filename;
    newDocument.mimeType = document.mimetype;
    newDocument.path = document.path;

    const savedDocument = await this.documentsRepository.save(newDocument);
    return {
      message: 'Document created successfully',
      document: {
        id: savedDocument.id,
        name: savedDocument.originalName,
        mimeType: savedDocument.mimeType,
      },
    };
  }

  /**
   * Find the document by id
   * @param id existing document's id
   * @returns the document if found else nul
   */
  async getDocumentById(id: number) {
    const document = await this.documentsRepository.findOne({ where: { id } });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    return document;
  }

  /**
   * prepare a read stream for the document
   * @param id the existing document's id
   * @returns stream of the document
   */
  async retrieveDocument(id: number) {
    const document = await this.getDocumentById(id);

    // get read stream from the file system
    const readStream = createReadStream(
      join(this.uploadPath, document.name),
    );

    return readStream;
  }

  /**
   * update the document with the new one
   * @param id existing document's id
   * @param document new document to replace the old one
   * @returns void
   */
  async updateDocument(id: number, document: Express.Multer.File) {
    const oldDocument = await this.getDocumentById(id);
    const documentToDelete = oldDocument.name;

    oldDocument.originalName = document.originalname;
    oldDocument.name = document.filename;
    oldDocument.mimeType = document.mimetype;

    try {
      await this.documentsRepository.save(oldDocument);
      await rm(join(this.uploadPath, documentToDelete));
    } catch (error) {
      await rm(document.path);
      throw error;
    }
  }

  /**
   * delete the document
   * @param id existing document's id
   */
  async deleteDocument(id: number) {
    const document = await this.getDocumentById(id);

    await rm(join(this.uploadPath, document.name));
    await this.documentsRepository.remove(document);
  }

  async getSizeOfDocument(path: string) {
    const stats = await stat(path);
    const size = stats.size;

    // convert it to human readable format
    return convertBytes(size);
  }

  async listDocuments() {
    const documents = await this.documentsRepository.find();

    return Promise.all(
      documents.map(async (document) => {
        const humanSize = await this.getSizeOfDocument(
          join(this.uploadPath, document.name),
        );

        return {
          id: document.id,
          name: document.originalName,
          size: humanSize,
          uploadedAt: document.uploadedAt,
        };
      }),
    );
  }
}
