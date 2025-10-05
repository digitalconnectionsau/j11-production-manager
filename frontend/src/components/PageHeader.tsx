import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  breadcrumbs = [], 
  actions,
  className = '' 
}) => {
  return (
    <div className={`bg-white border-b border-gray-200 mb-6 ${className}`}>
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="mb-2">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <svg 
                      className="w-4 h-4 mx-2 text-gray-400" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {crumb.href || crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className="hover:text-gray-700 transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title and Actions */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 text-sm max-w-2xl">
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center space-x-3 ml-6">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;