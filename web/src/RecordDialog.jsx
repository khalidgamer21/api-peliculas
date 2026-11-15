import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Pencil, Trash2, X } from 'lucide-react';
import { request } from './api.js';
import { Cover, StatePill } from './RecordLists.jsx';
import { eligibleRecords, formatDate, modules, recordName, relatedName, states } from './records.js';

const latestYear = new Date().getFullYear() + 5;

function Field({ field, record, references }) {
  const { key, label, type, source } = field;
  const value = record?.[key];
  let input;
  let hint;
  if (source) {
    const options = eligibleRecords(references, source);
    const unavailable = value !== undefined && !options.some((item) => item.id === value);
    if (unavailable) {
      hint = relatedName(references, source, value) + ' ya no esta disponible. Selecciona otro registro.';
    }
    input = (
      <select name={key} required defaultValue={unavailable ? '' : (value ?? '')}
        aria-describedby={hint ? key + '-hint' : undefined}>
        <option value="">Seleccionar</option>
        {options.map((row) => <option key={row.id} value={row.id}>{recordName(row, source)}</option>)}
      </select>
    );
  } else if (type === 'state') {
    input = (
      <select name={key} required defaultValue={value ?? 'Activo'}>
        {states.map((state) => <option key={state} value={state}>{state}</option>)}
      </select>
    );
  } else if (type === 'area') {
    input = <textarea name={key} rows={3} required maxLength={10000} defaultValue={value} />;
  } else {
    input = (
      <input name={key} type={type || 'text'} required defaultValue={value}
        maxLength={type === 'number' ? undefined : 10000}
        min={type === 'number' ? 1888 : undefined} max={type === 'number' ? latestYear : undefined}
        placeholder={type === 'url' ? 'https://...' : undefined} />
    );
  }

  const wide = type === 'area' || type === 'url';
  return (
    <label className={'field' + (wide ? ' field-wide' : '')}>
      <span>{label}</span>
      {input}
      {hint && <small id={key + '-hint'}>{hint}</small>}
    </label>
  );
}

function readForm(form, fields) {
  const data = new FormData(form);
  const input = {};
  for (const { key, label, type, source } of fields) {
    const value = data.get(key)?.trim();
    if (!value) throw new Error('Completa el campo ' + label.toLowerCase() + '.');
    if (type === 'url' && !/^https?:\/\//i.test(value)) {
      throw new Error(label + ' debe comenzar con http:// o https://.');
    }
    input[key] = source || type === 'number' ? Number(value) : value;
  }
  return input;
}

function RecordDetails({ record, module, references }) {
  const isMedia = module === 'media';
  return (
    <div className="details">
      {isMedia && <Cover src={record.portada} />}
      <dl className="details-grid">
        {modules[module].fields.filter(({ key }) => !isMedia || key !== 'titulo').map(({ key, label, type, source }) => (
          <div key={key} className={type === 'area' || type === 'url' ? 'field-wide' : undefined}>
            <dt>{label}</dt>
            <dd>
              {source && relatedName(references, source, record[key])}
              {type === 'state' && <StatePill value={record[key]} />}
              {type === 'url' && (
                <a href={record[key]} target="_blank" rel="noreferrer">
                  {record[key]} <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              )}
              {!source && type !== 'state' && type !== 'url' && record[key]}
            </dd>
          </div>
        ))}
        <div><dt>Creado</dt><dd><time dateTime={record.fechaCreacion}>{formatDate(record.fechaCreacion)}</time></dd></div>
        <div><dt>Actualizado</dt><dd><time dateTime={record.fechaActualizacion}>{formatDate(record.fechaActualizacion)}</time></dd></div>
      </dl>
    </div>
  );
}

export function RecordDialog({ mode, record, module, references, onSaved, onChangeMode, onClose, setConnection }) {
  const config = modules[module];
  const dialog = useRef(null);
  const [current, setCurrent] = useState(null);
  const [readError, setReadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const deleting = mode === 'delete';
  const reading = mode === 'edit' || mode === 'view';
  const writing = mode === 'edit' || mode === 'create';
  const name = recordName(current || record, module);
  const title = {
    create: config.create,
    edit: 'Editar ' + config.singular,
    view: name,
    delete: 'Eliminar ' + config.singular,
  }[mode];

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  useEffect(() => {
    if (!reading) return undefined;
    const controller = new AbortController();
    request(module, { id: record.id, signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) {
        setCurrent(result);
        setConnection('up');
      }
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setReadError(error.message);
      setConnection(error.status ? 'up' : 'down');
    });
    return () => controller.abort();
  }, [reading, module, record?.id, attempt, setConnection]);

  const missing = config.fields
    .filter(({ source }) => source && eligibleRecords(references, source).length === 0)
    .map(({ source }) => source);

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaveError('');

    let body;
    if (writing) {
      try {
        body = readForm(event.currentTarget, config.fields);
      } catch (error) {
        setSaveError(error.message);
        return;
      }
    }

    setSaving(true);
    try {
      const methods = { create: 'POST', edit: 'PUT', delete: 'DELETE' };
      const result = await request(module, { method: methods[mode], id: record?.id, body });
      setConnection('up');
      onSaved(result, mode, record?.id);
    } catch (error) {
      setSaveError(error.message);
      setConnection(error.status ? 'up' : 'down');
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialog} className={deleting ? 'confirm-dialog' : 'record-dialog'} aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}>
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button type="button" className="icon-button dialog-close" aria-label="Cerrar" onClick={onClose} disabled={saving}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {reading && !current && (
        <div className="dialog-body">
          <p role={readError ? 'alert' : 'status'}>{readError || 'Cargando ficha...'}</p>
          {readError && <button className="button button-secondary" type="button" onClick={() => {
            setReadError('');
            setAttempt((value) => value + 1);
          }}>Reintentar</button>}
        </div>
      )}
      {mode === 'view' && current && (
        <>
          <div className="dialog-body"><RecordDetails module={module} record={current} references={references} /></div>
          <div className="dialog-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>Cerrar ficha</button>
            <button type="button" className="button button-primary" onClick={() => onChangeMode('edit', current)}>
              <Pencil size={16} aria-hidden="true" /> Editar
            </button>
          </div>
        </>
      )}
      {(deleting || (writing && (!reading || current))) && (
        <form className="dialog-form" onSubmit={save} aria-busy={saving}>
          <div className="dialog-body">
            {deleting && <p>Se eliminara <strong>{name}</strong> del catalogo. Esta accion es permanente.</p>}
            {writing && (
              <>
                {missing.length > 0 && (
                  <div className="form-hint">
                    <p>Agrega los registros que faltan antes de guardar la produccion.</p>
                    <ul>
                      {missing.map((source) => (
                        <li key={source}><Link to={'/' + source}>Ir a {modules[source].label}</Link></li>
                      ))}
                    </ul>
                  </div>
                )}
                <fieldset className={'fields' + (module === 'media' ? ' fields-media' : '')} disabled={saving}>
                  <legend className="visually-hidden">Datos del registro</legend>
                  {config.fields.map((field) => <Field key={field.key} field={field} record={current} references={references} />)}
                </fieldset>
              </>
            )}
          </div>
          <div className="dialog-actions">
            {saveError && <p className="form-error" role="alert">{saveError}</p>}
            <button type="button" className="button button-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className={'button ' + (deleting ? 'button-danger' : 'button-primary')}
              disabled={saving || (writing && missing.length > 0)}>
              {deleting && <Trash2 size={16} aria-hidden="true" />}
              {saving ? 'Procesando...' : deleting ? 'Eliminar registro' : mode === 'edit' ? 'Guardar cambios' : 'Crear registro'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
