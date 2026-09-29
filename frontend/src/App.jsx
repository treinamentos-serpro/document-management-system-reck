import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import {
  listDocuments,
  uploadDocument,
} from './services/documentsApi.js';
import './App.css';

function getSavedUserId() {
  return localStorage.getItem('dms-user-id') || 'usuario-demo';
}

export default function App() {
  const [userId, setUserId] = useState(getSavedUserId);
  const [activeUserId, setActiveUserId] = useState(getSavedUserId);
  const [userError, setUserError] = useState('');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setListError('');

    listDocuments(activeUserId, { signal: controller.signal })
      .then(setDocuments)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setListError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [activeUserId, refreshKey]);

  function handleUserSubmit(event) {
    event.preventDefault();
    const nextUserId = userId.trim();

    if (!nextUserId) {
      setUserError('Informe um identificador para acessar seus documentos.');
      return;
    }

    localStorage.setItem('dms-user-id', nextUserId);
    setUserId(nextUserId);
    setActiveUserId(nextUserId);
    setUserError('');
  }

  async function handleUpload(file) {
    const document = await uploadDocument(file, activeUserId);
    setRefreshKey((currentKey) => currentKey + 1);
    return document;
  }

  function refreshDocuments() {
    setRefreshKey((currentKey) => currentKey + 1);
  }

  return (
    <div className="app-shell">
      <header className="top-band">
        <div className="top-band-content">
          <a className="brand" href="#main-content" aria-label="DMS, início">
            <span className="brand-mark" aria-hidden="true">D</span>
            <span>DMS</span>
          </a>
          <span className="top-band-caption">GESTÃO DE DOCUMENTOS</span>
        </div>
      </header>

      <main className="workspace" id="main-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">ARQUIVO PESSOAL</p>
            <h1>Seus documentos</h1>
            <p className="page-description">
              Envie e acesse seus arquivos em um só lugar.
            </p>
          </div>
          <form className="identity-form" onSubmit={handleUserSubmit}>
            <label htmlFor="user-id">Identificador do usuário</label>
            <div className="identity-controls">
              <input
                autoComplete="username"
                id="user-id"
                onChange={(event) => setUserId(event.target.value)}
                value={userId}
              />
              <button className="button button-secondary" type="submit">
                Acessar
              </button>
            </div>
            {userError && <p className="field-error" role="alert">{userError}</p>}
          </form>
        </div>

        <section aria-labelledby="upload-heading" className="upload-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ADICIONAR</p>
              <h2 id="upload-heading">Enviar documento</h2>
            </div>
            <span className="section-index" aria-hidden="true">01</span>
          </div>
          <UploadComponent onUpload={handleUpload} />
        </section>

        <section aria-labelledby="documents-heading" className="documents-section">
          <div className="section-heading documents-heading">
            <div>
              <p className="eyebrow">BIBLIOTECA</p>
              <h2 id="documents-heading">Documentos</h2>
            </div>
            <button
              aria-label="Atualizar lista de documentos"
              className="button button-text"
              disabled={isLoading}
              onClick={refreshDocuments}
              type="button"
            >
              Atualizar lista
            </button>
          </div>
          <DocumentList
            documents={documents}
            error={listError}
            isLoading={isLoading}
            onRetry={refreshDocuments}
            userId={activeUserId}
          />
        </section>
      </main>
      <footer className="page-footer">
        <span>Armazenamento local</span>
        <span className="footer-divider" aria-hidden="true" />
        <span>Usuário ativo: {activeUserId}</span>
      </footer>
    </div>
  );
}
