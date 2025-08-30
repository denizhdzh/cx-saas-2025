import { Link } from 'react-router-dom';
import { CaretRight } from 'phosphor-react';

export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="breadcrumb" className="mb-6 text-sm text-stone-400">
      <ol className="flex items-center space-x-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.path ? (
              <Link 
                to={item.path}
                className="hover:text-lime-400 transition-colors hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-stone-200 font-medium">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <CaretRight className="w-4 h-4 text-stone-500 ml-1.5" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 