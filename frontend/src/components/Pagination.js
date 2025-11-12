import React from 'react';
import { Pagination as BSPagination } from 'react-bootstrap';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div className="text-muted small">
        Mostrando página {currentPage} de {totalPages} 
        {totalItems && ` (${totalItems} total)`}
      </div>
      
      <BSPagination className="mb-0">
        <BSPagination.First 
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1}
        />
        <BSPagination.Prev 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
        />
        
        {startPage > 1 && (
          <>
            <BSPagination.Item onClick={() => onPageChange(1)}>1</BSPagination.Item>
            {startPage > 2 && <BSPagination.Ellipsis disabled />}
          </>
        )}
        
        {[...Array(endPage - startPage + 1)].map((_, idx) => {
          const pageNum = startPage + idx;
          return (
            <BSPagination.Item
              key={pageNum}
              active={pageNum === currentPage}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </BSPagination.Item>
          );
        })}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <BSPagination.Ellipsis disabled />}
            <BSPagination.Item onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </BSPagination.Item>
          </>
        )}
        
        <BSPagination.Next 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
        />
        <BSPagination.Last 
          onClick={() => onPageChange(totalPages)} 
          disabled={currentPage === totalPages}
        />
      </BSPagination>
    </div>
  );
};

export default Pagination;



