import React, { useRef, useEffect } from 'react';

const ResultDisplay = ({ 
  result, 
  showResult, 
  isGenerating, 
  showCursor, 
  isFavorited, 
  handleCopy, 
  toggleFavorite 
}) => {
  const resultRef = useRef(null);

  // 自动滚动效果
  useEffect(() => {
    if (resultRef.current && result && showResult) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result, showResult]);

  if (!result) return null;

  return (
    <div 
      ref={resultRef}
      className={`w-full mt-10 result-transition ${showResult ? 'show' : ''}`}
    >
      <div className="bg-white bg-opacity-95 rounded-2xl shadow-md mx-auto w-11/12 max-w-4xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-green-600">Enhanced Prompt</h2>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleFavorite}
              className="focus:outline-none"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill={isFavorited ? "#43B692" : "none"}
                stroke={isFavorited ? "#43B692" : "#718096"}
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="transition-all duration-300"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
            <button 
              onClick={handleCopy}
              className="focus:outline-none"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#718096" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="transition-all duration-300 hover:stroke-green-600"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-b-2xl">
          {result.sections.map((section, index) => (
            <div key={index} className="mb-6 last:mb-0">
              {section.title && (
                <h3 className="text-lg text-green-600 font-medium mb-3">{section.title}</h3>
              )}
              <div className="py-1">
                {section.content.map((line, idx) => (
                  <div key={idx}>
                    <p className="text-base leading-7 text-gray-800 whitespace-pre-wrap break-words my-2">
                      {line}
                      {index === result.sections.length-1 && 
                       idx === section.content.length-1 && 
                       showCursor && 
                       isGenerating && (
                        <span className="typing-cursor"></span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;