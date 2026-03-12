import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-custom py-20 text-center">
      <h1 className="text-8xl font-extrabold text-primary-500 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Página no encontrada</h2>
      <p className="text-surface-700 mb-8 max-w-md mx-auto">
        La página que buscas no existe o ha sido movida. Intenta buscar en nuestro catálogo.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-primary">
          Ir al Inicio
        </Link>
        <Link href="/productos" className="btn-secondary">
          Ver Productos
        </Link>
      </div>
    </div>
  );
}
