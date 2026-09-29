const documentsService = require('../services/documents.service');

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function requireOwner(req, res, next) {
  const owner = req.get('X-User-Id');

  if (!owner || !owner.trim()) {
    return sendError(res, 400, 'USER_ID_REQUIRED', 'Informe o identificador do usuário.');
  }

  req.owner = owner.trim();
  return next();
}

async function upload(req, res) {
  if (!req.file) {
    return sendError(res, 400, 'FILE_REQUIRED', 'Envie um arquivo para continuar.');
  }

  const document = await documentsService.createDocument(req.owner, req.file);
  return res.status(201).json({ document });
}

function list(req, res) {
  return res.status(200).json({
    documents: documentsService.listDocuments(req.owner),
  });
}

async function download(req, res, next) {
  const result = await documentsService.getDownload(req.params.id, req.owner);

  if (!result) {
    return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return res.download(result.filePath, result.document.originalName, (error) => {
    if (!error) return;
    if (res.headersSent) return res.destroy(error);

    if (error.code === 'ENOENT') {
      return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    return next(error);
  });
}

module.exports = { requireOwner, upload, list, download };