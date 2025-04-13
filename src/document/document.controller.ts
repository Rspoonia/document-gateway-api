/* eslint-disable no-undef */
import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { CheckPermissions } from "src/global/decorators/check-permission.decorator";
import { JwtAuthGuard } from "src/global/guards/jwt-auth.guard";
import { PermissionGuard } from "src/global/guards/permission.guard";
import { Action } from "src/types/permissions";
import { DocumentService } from "./document.service";
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ConfigService } from "@nestjs/config";
import { Response } from 'express';

@ApiTags("document")
@Controller("document")
export class DocumentController {
  constructor(
    private documentService: DocumentService,
    private configService: ConfigService,
  ) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiBody({
    description: "Upload new document",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const uploadPath = join(process.cwd(), 'uploads');
        callback(null, uploadPath);
      },
      filename: (req, file, callback) => {
        // Preserve the original extension
        const ext = extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      // Log the detected MIME type
      console.log('Uploading file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      callback(null, true);
    }
  }))
  @CheckPermissions((ability) => ability.can(Action.WRITE, "Document"))
  async createDocument(@UploadedFile() file: Express.Multer.File) {

    return this.documentService.create(file);
  }

  @Get(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @CheckPermissions((ability) => ability.can(Action.READ, "Document"))
  async getDocumentById(
    @Param("id", ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const document = await this.documentService.getDocumentById(id);
    const stream = await this.documentService.retrieveDocument(id);

    // Set content type based on the document's mime type
    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.originalName}"`,
    });

    return new StreamableFile(stream);
  }

  @Put(":id")
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Upload new document to update",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const uploadPath = join(process.cwd(), 'uploads');
        callback(null, uploadPath);
      },
      filename: (req, file, callback) => {
        // Preserve the original extension
        const ext = extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      // Log the detected MIME type
      console.log('Uploading file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      callback(null, true);
    }
  }))
  @CheckPermissions((ability) => ability.can(Action.UPDATE, "Document"))
  async updateDocument(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile() document: Express.Multer.File,
  ) {
    await this.documentService.updateDocument(id, document);

    return {
      message: "Document updated",
    };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @CheckPermissions((ability) => ability.can(Action.READ, "Document"))
  async listDocuments() {
    return this.documentService.listDocuments();
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @CheckPermissions((ability) => ability.can(Action.DELETE, "Document"))
  async deleteDocument(@Param("id", ParseIntPipe) id: number) {
    await this.documentService.deleteDocument(id);

    return {
      message: "Document deleted",
    };
  }
}
