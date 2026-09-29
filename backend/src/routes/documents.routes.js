const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

const router = express.Router();
const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);
const configuredUploadLimit = Number.parseInt(process.env.MAX_UPLOAD_BYTES, 10);
const maxUploadBytes = Number.isSafeInteger(configuredUploadLimit)
  && configuredUploadLimit > 0
  ? configuredUploadLimit
  : 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxUploadBytes, files: 1, fields: 0, parts: 2 },
});

router.post(
  '/upload',
  documentsController.requireOwner,
  upload.single('file'),
  documentsController.upload,
);
router.get('/documents', documentsController.requireOwner, documentsController.list);
router.get(
  '/documents/:id/download',
  documentsController.requireOwner,
  documentsController.download,
);

router.use((error, req, res, next) => {
  if (!(error instanceof multer.MulterError)) return next(error);

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'O arquivo excede o tamanho máximo permitido.',
      },
    });
  }

  return res.status(400).json({
    error: {
      code: 'INVALID_UPLOAD',
      message: 'Os dados do upload são inválidos.',
    },
  });
});

module.exports = router;