import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router';
import { Building2, ChevronRight, Clapperboard, Film, Layers, Tags, UserRound } from 'lucide-react';
import { modules } from './records.js';
import { RecordsPage } from './RecordsPage.jsx';

const navIcons = {
  media: Film,
  generos: Tags,
  directores: UserRound,
  productoras: Building2,
  tipos: Layers,
};

const connectionLabels = {
  waiting: 'Conectando con la API',
  up: 'API conectada',
  down: 'API sin conexion',
};

export function App() {
  const [connection, setConnection] = useState('waiting');
  const { pathname } = useLocation();
  const activeModule = modules[pathname.split('/')[1]];
  const demo = import.meta.env.MODE === 'demo';

  useEffect(() => {
    document.title = (activeModule?.title || 'Catalogo') + ' | Cineteca';
    window.scrollTo(0, 0);
  }, [pathname, activeModule]);

  function navLink(key) {
    const Icon = navIcons[key];
    return (
      <NavLink key={key} to={'/' + key} className="nav-link" end>
        <Icon size={19} aria-hidden="true" />
        <span>{modules[key].label}</span>
      </NavLink>
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <aside className="sidebar">
        <Link className="brand" to="/media" aria-label="Cineteca, inicio">
          <span className="brand-mark"><Clapperboard size={22} aria-hidden="true" /></span>
          <span>Cineteca</span>
        </Link>
        <nav className="main-nav" aria-label="Modulos">
          <div className="nav-section">
            <span className="nav-heading">Biblioteca</span>
            {navLink('media')}
          </div>
          <div className="nav-section">
            <span className="nav-heading">Catalogos</span>
            {Object.keys(navIcons).filter((key) => key !== 'media').map(navLink)}
          </div>
        </nav>
        <p className="sidebar-footer">Proyecto Integrador II</p>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <Link to="/media">Catalogo</Link>
            <ChevronRight size={15} aria-hidden="true" />
            <span>{activeModule?.label || 'Inicio'}</span>
          </div>
          <div className="connection-group">
            {demo && <span className="demo-badge">Modo demo</span>}
            <span className={'connection ' + connection} role="status">
              <span className="connection-dot" aria-hidden="true" />
              {connectionLabels[connection]}
            </span>
          </div>
        </header>
        <main id="contenido" className="page" tabIndex={-1}>
          <Routes>
            {Object.keys(modules).map((key) => (
              <Route key={key} path={'/' + key} element={
                <RecordsPage key={key} module={key} setConnection={setConnection} />
              } />
            ))}
            <Route path="*" element={<Navigate to="/media" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
