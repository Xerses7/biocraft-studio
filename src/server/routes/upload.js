// src/server/routes/upload.js - File upload routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { csrfProtection } = require('../middleware/csrf');
const { authRequired } = require('../middleware/security');

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a safe filename
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter to check file types
const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = ['.csv', '.txt', '.json', '.pdf', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedTypes.includes(ext)) {
    return cb(new Error('File type not allowed'), false);
  }
  
  // Check file size in the middleware
  if (parseInt(req.headers['content-length']) > 1024 * 1024 * 10) { // 10MB
    return cb(new Error('File too large'), false);
  }
  
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 } // 10MB
});

// Secure file upload endpoint
router.post('/', authRequired, csrfProtection, upload.single('file'), async (req, res) => {
  try {
    // SessionData should be available from authRequired middleware
    const sessionData = req.session.auth;
    
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(
      sessionData.access_token
    );
    
    if (userError) {
      // Delete the uploaded file
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      throw userError;
    }
    
    // File was uploaded successfully
    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
    
    // Store file metadata in database for the user
    await supabase
      .from('user_files')
      .insert([{
        user_id: userData.user.id,
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        upload_date: new Date()
      }]);
    
  } catch (error) {
    console.error('File upload error:', error);
    
    // Delete the uploaded file on error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(error.status || 500).json({
      message: error.message || 'Failed to upload file'
    });
  }
});

// Get uploaded files for user
router.get('/files', authRequired, async (req, res) => {
  try {
    const sessionData = req.session.auth;
    
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(
      sessionData.access_token
    );
    
    if (userError) throw userError;
    
    // Get files from database
    const { data: files, error: filesError } = await supabase
      .from('user_files')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('upload_date', { ascending: false });
    
    if (filesError) throw filesError;
    
    res.json({
      files: files
    });
    
  } catch (error) {
    console.error('Get files error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to retrieve files'
    });
  }
});

// Download a specific file
router.get('/files/:fileId', authRequired, async (req, res) => {
  const { fileId } = req.params;
  
  try {
    const sessionData = req.session.auth;
    
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(
      sessionData.access_token
    );
    
    if (userError) throw userError;
    
    // Get file info from database
    const { data: fileInfo, error: fileError } = await supabase
      .from('user_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userData.user.id) // Ensure user can only access their own files
      .single();
    
    if (fileError || !fileInfo) {
      return res.status(404).json({ message: 'File not found or not accessible' });
    }
    
    // Check if file exists on disk
    const filePath = path.join(__dirname, '../uploads', fileInfo.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Set Content-Disposition header for download with original filename
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.original_name}"`);
    res.setHeader('Content-Type', fileInfo.mime_type);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('File download error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to download file'
    });
  }
});

// Delete a file
router.delete('/files/:fileId', authRequired, csrfProtection, async (req, res) => {
  const { fileId } = req.params;
  
  try {
    const sessionData = req.session.auth;
    
    // Get user from auth
    const { data: userData, error: userError } = await supabase.auth.getUser(
      sessionData.access_token
    );
    
    if (userError) throw userError;
    
    // Get file info from database
    const { data: fileInfo, error: fileError } = await supabase
      .from('user_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userData.user.id) // Ensure user can only delete their own files
      .single();
    
    if (fileError || !fileInfo) {
      return res.status(404).json({ message: 'File not found or not accessible' });
    }
    
    // Delete file from disk
    const filePath = path.join(__dirname, '../uploads', fileInfo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete file metadata from database
    const { error: deleteError } = await supabase
      .from('user_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userData.user.id);
    
    if (deleteError) throw deleteError;
    
    res.json({
      message: 'File deleted successfully'
    });
    
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to delete file'
    });
  }
});

module.exports = router;