import { useRef, useState } from 'react';

export default function UploadComponent({ onUpload }) {
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const document = await onUpload(file);
      setSuccess(`${document.originalName} foi enviado.`);
      setFile(null);
      fileInput.current.value = '';
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event) {
    setFile(event.target.files[0] || null);
    setError('');
    setSuccess('');
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="upload-controls">
        <label className="file-picker" htmlFor="document-file">
          <span className="file-picker-title">
            {file ? file.name : 'Escolher arquivo'}
          </span>
          <span className="file-picker-hint">
            {file ? `${file.size.toLocaleString('pt-BR')} bytes` : 'Selecione um arquivo do seu dispositivo'}
          </span>
          <input
            id="document-file"
            onChange={handleFileChange}
            ref={fileInput}
            type="file"
          />
        </label>
        <button
          className="button button-primary"
          disabled={!file || isUploading}
          type="submit"
        >
          {isUploading ? 'Enviando...' : 'Enviar arquivo'}
        </button>
      </div>
      {error && <p className="feedback feedback-error" role="alert">{error}</p>}
      {success && <p className="feedback feedback-success" role="status">{success}</p>}
    </form>
  );
}