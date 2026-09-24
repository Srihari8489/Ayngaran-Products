import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';
import { PaginationMeta } from '../types';

interface PaginationProps {
  pagination?: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
  loading = false,
}) => {
  if (!pagination || pagination.total === 0) {
    return null;
  }

  const { page, limit, total, totalPages, hasNextPage, hasPreviousPage } = pagination;

  const start = Math.min((page - 1) * limit + 1, total);
  const end = Math.min(page * limit, total);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) {
        pages.push('...');
      }

      const startPage = Math.max(2, page - 1);
      const endPage = Math.min(totalPages - 1, page + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <>
      <style>{`
        .ay-pagination-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.95rem 1.35rem;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
          border-radius: 0 0 1rem 1rem;
          font-family: inherit;
        }

        .ay-pagination-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        /* Modern Info Pill */
        .ay-entries-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.85rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          font-size: 0.8125rem;
          color: #64748b;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          transition: all 0.15s ease;
        }

        .ay-entries-chip:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .ay-entries-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
        }

        .ay-entries-text {
          font-size: 0.8125rem;
          color: #64748b;
          letter-spacing: -0.01em;
        }

        .ay-num-highlight {
          font-weight: 700;
          color: #0f172a;
        }

        .ay-num-total {
          font-weight: 700;
          color: #113926;
        }

        /* Per page group */
        .ay-limit-group {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ay-limit-divider {
          display: inline-block;
          width: 1px;
          height: 16px;
          background: #e2e8f0;
          margin: 0 0.1rem;
        }

        .ay-limit-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748b;
          white-space: nowrap;
        }

        .ay-select-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .ay-select-wrap select {
          appearance: none;
          -webkit-appearance: none;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 0.3rem 1.85rem 0.3rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          outline: none;
          transition: all 0.18s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .ay-select-wrap select:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .ay-select-wrap select:focus {
          border-color: #113926;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(17, 57, 38, 0.12);
        }

        .ay-select-wrap .select-icon {
          position: absolute;
          right: 0.55rem;
          pointer-events: none;
          color: #64748b;
          transition: transform 0.15s ease;
        }

        .ay-select-wrap:hover .select-icon {
          color: #0f172a;
        }

        /* Right Side Navigation Buttons */
        .ay-pagination-right {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .ay-page-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2.15rem;
          height: 2.15rem;
          padding: 0 0.45rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
        }

        .ay-page-btn:hover:not(:disabled):not(.active) {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.06);
        }

        .ay-page-btn.active {
          background: linear-gradient(135deg, #113926 0%, #1e593a 100%);
          color: #ffffff;
          font-weight: 700;
          border: 1px solid #113926;
          box-shadow: 0 2px 8px rgba(17, 57, 38, 0.28);
          cursor: default;
        }

        .ay-page-btn:disabled {
          opacity: 0.42;
          background: #f8fafc;
          border-color: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 640px) {
          .ay-pagination-bar {
            flex-direction: column;
            align-items: flex-start;
          }
          .ay-pagination-right {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>

      <div className="ay-pagination-bar">
        {/* Left: Entries summary chip & per-page dropdown */}
        <div className="ay-pagination-left">
          {/* Refined modern chip */}
          <div className="ay-entries-chip">
            <span className="ay-entries-dot" />
            <span className="ay-entries-text">
              Showing <span className="ay-num-highlight">{start}</span>–<span className="ay-num-highlight">{end}</span> of{' '}
              <span className="ay-num-total">{total}</span> entries
            </span>
          </div>

          {onLimitChange && (
            <div className="ay-limit-group">
              <span className="ay-limit-divider" />
              <span className="ay-limit-label">Per page:</span>
              <div className="ay-select-wrap">
                <select
                  value={limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  disabled={loading}
                  aria-label="Rows per page"
                >
                  {limitOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="select-icon" />
              </div>
            </div>
          )}
        </div>

        {/* Right: Page navigation buttons */}
        <div className="ay-pagination-right">
          {/* First Page */}
          <button
            type="button"
            className="ay-page-btn"
            onClick={() => onPageChange(1)}
            disabled={!hasPreviousPage || loading}
            title="First Page"
            aria-label="First Page"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            className="ay-page-btn"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPreviousPage || loading}
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    padding: '0 0.35rem',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    userSelect: 'none',
                  }}
                >
                  …
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === page;

            return (
              <button
                key={pageNum}
                type="button"
                className={`ay-page-btn ${isActive ? 'active' : ''}`}
                onClick={() => onPageChange(pageNum)}
                disabled={loading || isActive}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next Page */}
          <button
            type="button"
            className="ay-page-btn"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage || loading}
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight size={14} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            className="ay-page-btn"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNextPage || loading}
            title="Last Page"
            aria-label="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
};

