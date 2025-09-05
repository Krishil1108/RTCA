const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { authenticateToken } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const router = express.Router();

// Helper function to create blurred thumbnail
const createBlurredThumbnail = async (buffer, mimetype) => {
  try {
    if (!mimetype.startsWith('image/')) {
      return null;
    }

    const thumbnail = await sharp(buffer)
      .resize(300, 300, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .blur(10) // Apply heavy blur
      .jpeg({ quality: 30 }) // Low quality for small size
      .toBuffer();

    const base64Thumbnail = thumbnail.toString('base64');
    return `data:image/jpeg;base64,${base64Thumbnail}`;
  } catch (error) {
    console.error('Error creating blurred thumbnail:', error);
    return null;
  }
};

// Configure Cloudinary (you can also use local storage)
const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                            process.env.CLOUDINARY_API_KEY && 
                            process.env.CLOUDINARY_API_SECRET &&
                            process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloudinary-cloud-name';

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Configure storage
const storage = (process.env.NODE_ENV === 'production' && cloudinaryConfigured) ? 
  // Cloudinary storage for production (when configured)
  new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'rtca-uploads',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'mp3', 'wav', 'ogg', 'pdf', 'doc', 'docx', 'txt'],
      resource_type: 'auto'
    }
  }) :
  // Memory storage for development or when Cloudinary is not configured
  multer.memoryStorage();

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Increased to 100MB limit for better large file support
  },
  fileFilter: function (req, file, cb) {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, audio, and documents are allowed.'));
    }
  }
});

// Upload single file
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let fileData;
    let blurredThumbnail = null;

    // Create blurred thumbnail for images
    if (req.file.mimetype.startsWith('image/')) {
      const buffer = req.file.buffer || 
        (req.file.path ? fs.readFileSync(req.file.path) : null);
      
      if (buffer) {
        blurredThumbnail = await createBlurredThumbnail(buffer, req.file.mimetype);
      }
    }

    if (process.env.NODE_ENV === 'production' && cloudinaryConfigured) {
      // Cloudinary upload
      fileData = {
        filename: req.file.filename || req.file.original_filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: req.file.path,
        publicId: req.file.public_id || null,
        blurredThumbnail: blurredThumbnail,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      };
    } else {
      // Memory storage - convert to base64 for temporary storage
      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      
      fileData = {
        filename: `${Date.now()}-${req.file.originalname}`,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: dataUrl, // Base64 data URL for immediate display
        publicId: null,
        blurredThumbnail: blurredThumbnail,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      };
    }

    res.json({
      success: true,
      file: fileData
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed: ' + error.message });
  }
});

// Upload multiple files
router.post('/upload-multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const filesData = req.files.map(file => {
      if (process.env.NODE_ENV === 'production' && cloudinaryConfigured) {
        // Cloudinary upload
        return {
          filename: file.filename || file.original_filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: file.path,
          publicId: file.public_id || null,
          uploadedAt: new Date(),
          uploadedBy: req.user.id
        };
      } else {
        // Memory storage - convert to base64
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        
        return {
          filename: `${Date.now()}-${file.originalname}`,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: dataUrl,
          publicId: null,
          uploadedAt: new Date(),
          uploadedBy: req.user.id
        };
      }
    });

    res.json({
      success: true,
      files: filesData
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({ error: 'File upload failed: ' + error.message });
  }
});

// Download full resolution image endpoint
router.get('/download/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // In a real application, you would:
    // 1. Look up the file metadata from your database using fileId
    // 2. Check if the user has permission to download this file
    // 3. Return the full resolution image URL or stream the file
    
    // For now, we'll return the file URL from the request
    // This is a simplified implementation
    const fileUrl = req.query.url;
    
    if (!fileUrl) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // If using Cloudinary in production
    if (process.env.NODE_ENV === 'production' && cloudinaryConfigured) {
      // Return the Cloudinary URL for download
      res.json({
        success: true,
        downloadUrl: fileUrl,
        message: 'File ready for download'
      });
    } else {
      // For development with memory storage, return the base64 data URL
      res.json({
        success: true,
        downloadUrl: fileUrl,
        message: 'File ready for download'
      });
    }
    
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'File download failed: ' + error.message });
  }
});

// Delete file
router.delete('/delete/:publicId', authenticateToken, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(req.params.publicId);
      if (result.result === 'ok') {
        res.json({ success: true, message: 'File deleted successfully' });
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    } else {
      // Delete from local storage
      const filePath = path.join(__dirname, '../uploads', req.params.publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'File deleted successfully' });
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    }
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
});

module.exports = router;
