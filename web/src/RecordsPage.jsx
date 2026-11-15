import { useEffect, useState } from 'react';
import { CircleAlert, Film, Plus, RefreshCw, Search } from 'lucide-react';
import { request } from './api.js';
import { CatalogTable, MediaGrid } from './RecordLists.jsx';
import { RecordDialog } from './RecordDialog.jsx';
import { catalogs, modules, recordName, relatedName, searchText, states } from './records.js';

export function RecordsPage({ module, setConnection }) {
  const config = modules[module];
  const isMedia = module === 'media';
  const hasState = config.fields.some(({ key }) => key === 'estado');
  const [rows, setRows] = useState(null);
  const [references, setReferences] = useState({});
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [genre, setGenre] = useState('');
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const keys = isMedia ? [module, ...catalogs] : [module];
    setConnection('waiting');

    async function load() {
      try {
        const [records, ...catalogRows] = await Promise.all(
          keys.map((key) => request(key, { signal: controller.signal }))
        );
        if (controller.signal.aborted) return;
        setRows(records);
        if (isMedia) {
          setReferences(Object.fromEntries(catalogs.map((key, index) => [key, catalogRows[index]])));
        }
        setConnection('up');
      } catch (failure) {
        if (controller.signal.aborted) return;
        setError(failure.message);
        setConnection(failure.status ? 'up' : 'down');
      }
    }

    load();
    return () => controller.abort();
  }, [module, isMedia, attempt, setConnection]);

  function retry() {
    setRows(null);
    setError('');
    setNotice('');
    setAttempt((value) => value + 1);
  }

  function open(mode, record) {
    setNotice('');
    setDialog({ mode, record });
  }

  function onSaved(record, mode, originalId) {
    if (mode === 'create') setRows((items) => [...items, record]);
    if (mode === 'edit') setRows((items) => items.map((item) => item.id === record.id ? record : item));
    if (mode === 'delete') setRows((items) => items.filter((item) => item.id !== originalId));
    const messages = {
      create: 'Registro creado.',
      edit: 'Cambios guardados.',
      delete: 'Registro eliminado.',
    };
    setDialog(null);
    setNotice(messages[mode]);
  }

  const filtered = (rows || []).filter((record) => {
    const terms = [recordName(record, module)];
    if (isMedia) {
      terms.push(record.serial, relatedName(references, 'generos', record.generoId));
      if (filter && String(record.tipoId) !== filter) return false;
      if (genre && String(record.generoId) !== genre) return false;
    } else if (filter && record.estado !== filter) {
      return false;
    }
    return searchText(terms.join(' ')).includes(searchText(query));
  });

  const ready = rows !== null && !error;
  const createButton = (
    <button type="button" className={'button ' + (isMedia ? 'button-light' : 'button-primary')}
      disabled={!ready} onClick={() => open('create')}>
      <Plus size={18} aria-hidden="true" />
      {config.create}
    </button>
  );

  return (
    <>
      {isMedia ? (
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <h1 id="page-title">{config.title}</h1>
            <p>Gestiona las fichas y los creditos de cada produccion.</p>
            {createButton}
          </div>
        </section>
      ) : (
        <header className="page-heading">
          <h1 id="page-title">{config.title}</h1>
          {createButton}
        </header>
      )}

      <p className={notice ? 'notice' : 'visually-hidden'} role="status">{notice}</p>
      {error && (
        <section className="empty-state" aria-label="Carga de registros">
          <span className="empty-icon"><CircleAlert size={25} aria-hidden="true" /></span>
          <h2>No se pudo cargar el modulo</h2>
          <p role="alert">{error}</p>
          <button type="button" className="button button-secondary" onClick={retry}>Reintentar</button>
        </section>
      )}
      {!rows && !error && <p className="loading" role="status">Cargando registros...</p>}

      {ready && (
        <section className="records" aria-label={isMedia ? 'Producciones' : 'Listado de ' + config.label.toLowerCase()}>
          <div className="records-toolbar">
            <div className="records-heading">
              {isMedia && <h2>Producciones</h2>}
              <span className="count">{filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}</span>
            </div>
            <div className="filters">
              <label className="search">
                <Search size={17} aria-hidden="true" />
                <span className="visually-hidden">{isMedia ? 'Buscar por titulo o serial' : 'Buscar por nombre'}</span>
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                  placeholder={isMedia ? 'Buscar por titulo o serial' : 'Buscar por nombre'} />
              </label>
              {isMedia && (
                <>
                  <select aria-label="Filtrar por tipo" value={filter} onChange={(event) => setFilter(event.target.value)}>
                    <option value="">Todos los tipos</option>
                    {references.tipos.map((type) => <option key={type.id} value={type.id}>{type.nombre}</option>)}
                  </select>
                  <select aria-label="Filtrar por genero" value={genre} onChange={(event) => setGenre(event.target.value)}>
                    <option value="">Todos los generos</option>
                    {references.generos.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                  </select>
                </>
              )}
              {hasState && (
                <select aria-label="Filtrar por estado" value={filter} onChange={(event) => setFilter(event.target.value)}>
                  <option value="">Todos los estados</option>
                  {states.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
              )}
              <button type="button" className="icon-button refresh" onClick={retry}
                aria-label="Actualizar listado" title="Actualizar listado">
                <RefreshCw size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          {filtered.length === 0 && (
            <section className="empty-state">
              <span className="empty-icon"><Film size={25} aria-hidden="true" /></span>
              <h2>{rows.length ? 'No encontramos registros' : 'Aun no hay registros'}</h2>
              <p>{rows.length ? 'Prueba con otra busqueda o cambia los filtros.' : 'Usa el boton de arriba para agregar el primer registro.'}</p>
              {(query || filter || genre) && (
                <button type="button" className="button button-secondary" onClick={() => {
                  setQuery('');
                  setFilter('');
                  setGenre('');
                }}>Limpiar filtros</button>
              )}
            </section>
          )}
          {filtered.length > 0 && (isMedia
            ? <MediaGrid rows={filtered} references={references} onAction={open} />
            : <CatalogTable rows={filtered} module={module} onAction={open} />)}
        </section>
      )}

      {dialog && (
        <RecordDialog
          key={dialog.mode + '-' + dialog.record?.id}
          {...dialog}
          module={module}
          references={references}
          onSaved={onSaved}
          onChangeMode={open}
          onClose={() => setDialog(null)}
          setConnection={setConnection}
        />
      )}
    </>
  );
}
