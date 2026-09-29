const path = require('node:path');
const { randomUUID } = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');

function createDocument(owner, file) {
  const normalizedName = String(file.originalname || '').replace(/\\/g, '/');
  const document = {
    id: randomUUID(),
    originalName: path.posix.basename(normalizedName) || 'document',
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };

  return documentsRepository.create(document, file.path);
}

function listDocuments(owner) {
  return documentsRepository.listByOwner(owner);
}

function getDownload(id, owner) {
  return documentsRepository.findOwnedById(id, owner);
}

module.exports = { createDocument, listDocuments, getDownload };