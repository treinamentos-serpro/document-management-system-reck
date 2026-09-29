const path = require('node:path');
const { randomUUID } = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');

function getSafeOriginalName(originalName) {
  const normalizedName = String(originalName || '').replace(/\\/g, '/');
  return path.posix.basename(normalizedName) || 'document';
}

async function createDocument(owner, file) {
  const document = {
    id: randomUUID(),
    originalName: getSafeOriginalName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };

  try {
    return documentsRepository.create(document, file.path);
  } catch (error) {
    await documentsRepository.removeStoredFile(file.path).catch(() => {});
    throw error;
  }
}

function listDocuments(owner) {
  return documentsRepository.listByOwner(owner);
}

function getDownload(id, owner) {
  return documentsRepository.findOwnedById(id, owner);
}

module.exports = { createDocument, listDocuments, getDownload };