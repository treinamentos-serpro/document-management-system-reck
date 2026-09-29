const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_UPLOAD_BYTES = '10';

const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista e baixa documentos do proprietário', async (context) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  context.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.promises.rm(storageDirectory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const body = new FormData();
  body.append('file', new Blob(['data'], { type: 'text/plain' }), 'relatorio.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body,
  });
  assert.strictEqual(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.strictEqual(document.originalName, 'relatorio.txt');
  assert.strictEqual(document.size, 4);
  assert.strictEqual(document.owner, 'usuario-a');
  assert.ok(document.id);
  assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-a' },
  });
  assert.deepStrictEqual(await listResponse.json(), { documents: [document] });

  const otherUserListResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-b' },
  });
  assert.deepStrictEqual(await otherUserListResponse.json(), { documents: [] });

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'usuario-a' } },
  );
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), 'data');
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);

  const unauthorizedDownload = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'usuario-b' } },
  );
  assert.strictEqual(unauthorizedDownload.status, 404);
});

test('valida identidade, arquivo obrigatório e limite de upload', async (context) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  context.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.promises.rm(storageDirectory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const missingOwner = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(missingOwner.status, 400);

  const missingFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
  });
  assert.strictEqual(missingFile.status, 400);

  const largeBody = new FormData();
  largeBody.append('file', new Blob(['conteudo grande'], { type: 'text/plain' }), 'grande.txt');
  const largeUpload = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: largeBody,
  });
  assert.strictEqual(largeUpload.status, 413);
});

test('rejeita campos extras e sanitiza nome com traversal', async (context) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  context.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.promises.rm(storageDirectory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const extraFieldBody = new FormData();
  extraFieldBody.append('unexpected', 'value');
  extraFieldBody.append('file', new Blob(['x']), 'arquivo.txt');
  const extraFieldResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: extraFieldBody,
  });
  assert.strictEqual(extraFieldResponse.status, 400);

  const traversalBody = new FormData();
  traversalBody.append('file', new Blob(['x']), '../../fora.txt');
  const traversalResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-a' },
    body: traversalBody,
  });
  assert.strictEqual(traversalResponse.status, 201);
  const { document } = await traversalResponse.json();
  assert.strictEqual(document.originalName, 'fora.txt');
});
