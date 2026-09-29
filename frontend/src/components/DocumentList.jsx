import DownloadButton from './DownloadButton.jsx';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, error, isLoading, onRetry, userId }) {
  if (isLoading) {
    return <p className="list-message" role="status">Carregando documentos...</p>;
  }

  if (error) {
    return (
      <div className="list-message list-error" role="alert">
        <p>{error}</p>
        <button className="button button-secondary" onClick={onRetry} type="button">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="list-message empty-state">
        Nenhum documento enviado para este usuário.
      </p>
    );
  }

  return (
    <>
      <div className="document-list-labels" aria-hidden="true">
        <span>ARQUIVO</span>
        <span>ENVIADO EM</span>
        <span>TAMANHO</span>
        <span />
      </div>
      <ul className="document-list">
        {documents.map((document) => (
          <li className="document-row" key={document.id}>
            <div className="document-name">
              <span className="document-file-mark" aria-hidden="true">DOC</span>
              <span title={document.originalName}>{document.originalName}</span>
            </div>
            <time className="document-date" dateTime={document.uploadedAt}>
              {formatUploadDate(document.uploadedAt)}
            </time>
            <span className="document-size">{formatFileSize(document.size)}</span>
            <DownloadButton document={document} userId={userId} />
          </li>
        ))}
      </ul>
    </>
  );
}