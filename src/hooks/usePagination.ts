import { useState, useCallback, useMemo } from 'react';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
}

export interface UsePaginationReturn extends PaginationState {
  totalPages: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalCount: (count: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

interface UsePaginationProps {
  initialPageSize?: number;
  initialPage?: number;
}

export function usePagination({ 
  initialPageSize = 25, 
  initialPage = 1 
}: UsePaginationProps = {}): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(totalCount / pageSize)), 
    [totalCount, pageSize]
  );

  const offset = useMemo(() => 
    (currentPage - 1) * pageSize, 
    [currentPage, pageSize]
  );

  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  const setPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)));
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const nextPage = useCallback(() => {
    if (hasNext) setCurrentPage(prev => prev + 1);
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrev) setCurrentPage(prev => prev - 1);
  }, [hasPrev]);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    offset,
    hasNext,
    hasPrev,
    setPage,
    setPageSize,
    setTotalCount,
    nextPage,
    prevPage,
    reset,
  };
}
