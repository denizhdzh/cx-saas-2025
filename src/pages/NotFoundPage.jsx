import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Warning, House } from 'phosphor-react';

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | tool/</title>
        <meta name="description" content="The page you are looking for does not exist on tool/." />
      </Helmet>
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md">
          <Warning className="w-20 h-20 sm:w-24 sm:h-24 text-yellow-400 mx-auto mb-6" />
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-stone-100">
            404
          </h1>
          <p className="mt-4 text-2xl sm:text-3xl font-medium text-stone-200">
            Page Not Found
          </p>
          <p className="mt-6 text-lg leading-relaxed text-stone-400">
            Oops! The page you were looking for doesn't seem to exist. It might have been moved, deleted, or maybe you just mistyped the URL.
          </p>
          <div className="mt-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-lime-500 hover:bg-lime-600 text-stone-900 px-6 py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-lime-500"
            >
              <House className="w-5 h-5" />
              Go to Homepage
            </Link>
          </div>
        </div>
      </main>
    </>
  );
} 