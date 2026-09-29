const fs = require('node:fs/promises');

const documents = new Map();

function toPublicDocument(document) {
  const { filePath, ...publicDocument } = document;
  return publicDocument;
}

function create(document, filePath) {
  const storedDocument = { ...document, filePath };
  documents.set(document.id, storedDocument);
  return toPublicDocument(storedDocument);
}

function listByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .map(toPublicDocument);
}

async function findOwnedById(id, owner) {
  const document = documents.get(id);
  if (!document || document.owner !== owner) return null;

  try {
    await fs.access(document.filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }

  return {
    document: toPublicDocument(document),
    filePath: document.filePath,
  };
}

module.exports = { create, listByOwner, findOwnedById };