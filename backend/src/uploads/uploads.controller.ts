import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config: timestamp + random suffix + safe extension
const multerDiskStorage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBase || 'upload'}-${uniqueSuffix}${ext}`);
  },
});

const imageFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|svg|avif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new BadRequestException('Only image files (JPG, PNG, WebP, GIF, SVG, AVIF) are permitted.'), false);
};

@Controller('uploads')
export class UploadsController {
  /**
   * Upload a single image file
   */
  @Post('single')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerDiskStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    }),
  )
  uploadSingle(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('No image file provided.');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    return {
      filename: file.filename,
      originalName: file.originalname,
      url: fileUrl,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Upload multiple image files (up to 20 at once)
   */
  @Post('multiple')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: multerDiskStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[], @Req() req: Request) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No image files provided.');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `${baseUrl}/uploads/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
    }));
  }

  /**
   * List all uploaded images stored in the server uploads directory
   */
  @Get()
  listUploadedFiles(@Req() req: Request) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    if (!fs.existsSync(uploadsDir)) {
      return [];
    }

    const entries = fs.readdirSync(uploadsDir);
    const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']);

    const files = entries
      .filter((filename) => {
        const ext = path.extname(filename).toLowerCase();
        return allowedExts.has(ext);
      })
      .map((filename) => {
        const filePath = path.join(uploadsDir, filename);
        try {
          const stats = fs.statSync(filePath);
          return {
            filename,
            url: `${baseUrl}/uploads/${filename}`,
            size: stats.size,
            createdAt: stats.birthtime || stats.mtime,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return files;
  }

  /**
   * Optional: Delete a file from the uploads directory
   */
  @Delete(':filename')
  deleteFile(@Param('filename') filename: string) {
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDir, safeFilename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true, message: `Deleted ${safeFilename}` };
    }

    throw new NotFoundException(`File ${safeFilename} not found.`);
  }
}
