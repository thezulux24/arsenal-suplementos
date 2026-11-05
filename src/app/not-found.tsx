import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap page-head" style={{ minHeight: '50vh', display: 'grid', gap: 18, alignContent: 'start' }}>
      <h1>Esta página no existe</h1>
      <p className="lede">Puede que el enlace haya cambiado. El catálogo completo está en la portada.</p>
      <Link href="/" className="plaque" style={{ justifySelf: 'start' }}>
        Volver a la tienda
      </Link>
    </div>
  );
}
