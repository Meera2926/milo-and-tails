import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-2 text-3xl font-semibold">This page has wandered off</h1>
        <p className="mt-3 text-sm text-muted">
          The link may be out of date. Head back to the dashboard and try again from there.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Go to Milo &amp; Tails
        </Link>
      </div>
    </div>
  );
}
