import React from 'react';

const LoadingSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="loading-skeleton">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-row" style={{ animationDelay: `${rowIndex * 0.1}s` }}>
          {[...Array(columns)].map((_, colIndex) => (
            <div key={colIndex} className="skeleton-cell">
              <div className="skeleton-shimmer"></div>
            </div>
          ))}
        </div>
      ))}
      
      <style jsx>{`
        .loading-skeleton {
          padding: 1rem 0;
        }
        
        .skeleton-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
          animation: fadeIn 0.5s ease-out;
        }
        
        .skeleton-cell {
          flex: 1;
          height: 40px;
          background: linear-gradient(
            90deg,
            #f0f0f0 0%,
            #f8f8f8 50%,
            #f0f0f0 100%
          );
          background-size: 200% 100%;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }
        
        .skeleton-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          height: 100%;
          width: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
          );
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSkeleton;



