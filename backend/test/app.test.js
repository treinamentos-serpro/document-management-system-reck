const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_UPLOAD_BYTES = '5';

const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download respeitam o proprietário', async (context) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  context.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.promises.rm(storageDirectory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const uploadBody = new FormData();
  uploadBody.append('file', new Blob(['data'], { type: 'text/plain' }), 'relatorio.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: uploadBody,
  });
  assert.strictEqual(uploadResponse.status, 201);

  const { document } = await uploadResponse.json();
  assert.deepStrictEqual(document, {
    id: document.id,
    originalName: 'relatorio.txt',
    size: 4,
    uploadedAt: document.uploadedAt,
    owner: 'usuario-a',
  });

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-a' },
  });
  assert.deepStrictEqual(await listResponse.json(), { documents: [document] });

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'usuario-a' } },
  );
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), 'data');
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);

  const unauthorizedResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'usuario-b' } },
  );
  assert.strictEqual(unauthorizedResponse.status, 404);
});

test('valida o usuário, a presença do arquivo e o tamanho máximo', async (context) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  context.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.promises.rm(storageDirectory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const missingOwnerResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(missingOwnerResponse.status, 400);
  assert.strictEqual((await missingOwnerResponse.json()).error.code, 'USER_ID_REQUIRED');

  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
  });
  assert.strictEqual(missingFileResponse.status, 400);
  assert.strictEqual((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

  const largeUploadBody = new FormData();
  largeUploadBody.append('file', new Blob(['grande!!'], { type: 'text/plain' }), 'grande.txt');
  const largeUploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: largeUploadBody,
  });
  assert.strictEqual(largeUploadResponse.status, 413);
  assert.strictEqual((await largeUploadResponse.json()).error.code, 'FILE_TOO_LARGE');
});
