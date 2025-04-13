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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CheckPermissions } from "src/global/decorators/check-permission.decorator";
import { JwtAuthGuard } from "src/global/guards/jwt-auth.guard";
import { PermissionGuard } from "src/global/guards/permission.guard";
import { Action } from "src/types/permissions";
import { DocumentService } from "./document.service";
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ConfigService } from "@nestjs/config";
import { Response } from 'express';

@ApiTags("Documents")
@Controller("document")
export class DocumentController {
  constructor(
    private documentService: DocumentService,
    private configService: ConfigService,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Upload a new document',
    description: 'Upload a new document to the system. The file will be stored on disk and metadata in the database.'
  })
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
          description: "The file to upload",
        },
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Document created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Document created successfully' },
        document: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'example.pdf' },
            mimeType: { type: 'string', example: 'application/pdf' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file format or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
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
  @ApiOperation({ 
    summary: 'Download a document',
    description: 'Download a document by its ID. Returns the file as a stream.'
  })
  @ApiParam({ name: 'id', description: 'Document ID', type: 'number', example: 1 })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Document file stream' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
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
  @ApiOperation({ 
    summary: 'Update a document',
    description: 'Replace an existing document with a new version. The old file will be deleted.'
  })
  @ApiParam({ name: 'id', description: 'Document ID', type: 'number', example: 1 })
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
          description: "The new file to replace the existing document",
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Document updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Document updated' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file format or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
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
  @ApiOperation({ 
    summary: 'List all documents',
    description: 'Get a list of all documents with their metadata'
  })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'List of documents',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'example.pdf' },
          size: { type: 'string', example: '1.2 MB' },
          uploadedAt: { type: 'string', format: 'date-time', example: '2024-04-13T12:00:00Z' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @CheckPermissions((ability) => ability.can(Action.READ, "Document"))
  async listDocuments() {
    return this.documentService.listDocuments();
  }

  @Delete(":id")
  @ApiOperation({ 
    summary: 'Delete a document',
    description: 'Delete a document and its associated file from the system'
  })
  @ApiParam({ name: 'id', description: 'Document ID', type: 'number', example: 1 })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'Document deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Document deleted' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @CheckPermissions((ability) => ability.can(Action.DELETE, "Document"))
  async deleteDocument(@Param("id", ParseIntPipe) id: number) {
    await this.documentService.deleteDocument(id);

    return {
      message: "Document deleted",
    };
  }
}
