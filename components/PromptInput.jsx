import React from 'react';

const PromptInput = ({ 
  onGeneratePrompt, 
  isGenerating, 
  inputText, 
  handleInputChange,
  stopGeneration 
}) => {
  const handleSubmit = () => {
    if (inputText && inputText.trim()) {
      onGeneratePrompt();
    }
  };
  
  return (
    <div className="flex flex-col items-center w-full">
      {/* 输入区域 */}
      <div className="input-container">
        <textarea 
          className="main-textarea"
          placeholder="Write down any idea, and with one click, transform it into an enhanced prompt for AI communication! (Examples: I need to write a sick leave email / I want to create a restaurant review for social media / I want to develop a weekly weight loss plan / I want to learn and absorb the essence of Elon Musk's autobiography...)"
          value={inputText}
          onChange={handleInputChange}
        />
      </div>
      
      {/* 按钮区域 */}
      <div className="flex justify-center mt-8">
        <button 
          className="main-button"
          onClick={isGenerating ? stopGeneration : handleSubmit}
          disabled={!inputText || isGenerating}
          style={{
            opacity: (!inputText || isGenerating) ? 0.7 : 1,
            cursor: (!inputText || isGenerating) ? 'not-allowed' : 'pointer'
          }}
        >
          <img 
            src="/icons/spark.svg" 
            alt="Spark" 
          />
          {isGenerating ? 'Generating...' : 'Spark Inspiration'}
        </button>
      </div>
    </div>
  );
};

export default PromptInput;