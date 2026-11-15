import { useState } from 'react';
import { ArrowUpRight, Eye, Film, Pencil, Trash2 } from 'lucide-react';
import { formatDate, modules, recordName, relatedName } from './records.js';

export function Cover({ src }) {
  const [broken, setBroken] = useState('');
  return (
    <div className="cover">
      <Film size={34} aria-hidden="true" />
      {src && src !== broken && (
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer"
          onError={() => setBroken(src)} />
      )}
    </div>
  );
}

function RowActions({ record, module, onAction, includeView = false }) {
  const name = recordName(record, module);
  return (
    <div className="row-actions">
      {includeView && (
        <button type="button" className="icon-button" title="Ver ficha" aria-label={'Ver ficha de ' + name}
          onClick={() => onAction('view', record)}>
          <Eye size={17} aria-hidden="true" />
        </button>
      )}
      <button type="button" className="icon-button" title="Editar" aria-label={'Editar ' + name}
        onClick={() => onAction('edit', record)}>
        <Pencil size={16} aria-hidden="true" />
      </button>
      <button type="button" className="icon-button icon-danger" title="Eliminar" aria-label={'Eliminar ' + name}
        onClick={() => onAction('delete', record)}>
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function MediaGrid({ rows, references, onAction }) {
  return (
    <div className="media-grid">
      {rows.map((record) => {
        const type = relatedName(references, 'tipos', record.tipoId);
        const genre = relatedName(references, 'generos', record.generoId);
        const director = relatedName(references, 'directores', record.directorId);
        return (
          <article className="media-card" key={record.id}>
            <Cover src={record.portada} />
            <div className="media-copy">
              <div className="media-meta">
                <span className="type-pill">{type}</span>
                <span>{record.anioEstreno}</span>
              </div>
              <h3>{record.titulo}</h3>
              <p>{genre} <span aria-hidden="true">/</span> {director}</p>
            </div>
            <div className="media-actions">
              <button type="button" className="text-button" aria-label={'Ver ficha de ' + record.titulo}
                onClick={() => onAction('view', record)}>
                Ver ficha <ArrowUpRight size={15} aria-hidden="true" />
              </button>
              <RowActions record={record} module="media" onAction={onAction} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function StatePill({ value }) {
  return <span className={'state-pill ' + value.toLowerCase()}>{value}</span>;
}

export function CatalogTable({ rows, module, onAction }) {
  const { label, fields, name } = modules[module];
  return (
    <div className="table-wrap" role="region" aria-label={'Tabla de ' + label.toLowerCase()} tabIndex={0}>
      <table>
        <thead>
          <tr>
            {fields.map((field) => <th scope="col" key={field.key}>{field.label}</th>)}
            <th scope="col">Actualizado</th>
            <th scope="col" className="actions-heading">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((record) => (
            <tr key={record.id}>
              {fields.map(({ key }) => {
                if (key === name) return (
                  <th key={key} scope="row">
                    <button type="button" className="record-name" onClick={() => onAction('view', record)}>
                      {record[key]}
                    </button>
                  </th>
                );
                return (
                  <td key={key}>
                    {key === 'estado'
                      ? <StatePill value={record[key]} />
                      : <span className="cell-text" title={record[key]}>{record[key]}</span>}
                  </td>
                );
              })}
              <td className="date-cell"><time dateTime={record.fechaActualizacion}>{formatDate(record.fechaActualizacion)}</time></td>
              <td><RowActions record={record} module={module} onAction={onAction} includeView /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
