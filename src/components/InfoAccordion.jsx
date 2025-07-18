import React, { useState } from 'react';
import visualizationInfo from '../data/visualizationInfo.json';

// Self-contained SVG icon components for clarity and reuse
const HamburgerIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
  </svg>
);

const InfoAccordion = ({ visualizationType, isPanelOpen, onToggle }) => {
  const info = visualizationInfo[visualizationType];

  if (!info) return null;

  return (
    <>
      {/* Hamburger button to open the panel. Only visible when panel is closed. */}
      {!isPanelOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-12 z-[1001] bg-white p-2 rounded-md shadow-lg text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open information panel"
          aria-controls="info-panel"
        >
          <HamburgerIcon />
        </button>
      )}

      {/* The side panel itself. Slides in from the left. */}
      <div
        id="info-panel"
        className={`fixed top-0 left-0 h-full w-80 md:w-96 bg-white shadow-xl z-[1000] transform transition-transform duration-300 ease-in-out ${
          isPanelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="region"
        aria-labelledby="info-panel-title"
      >
        {/* Scrollable container for content. Positioned relative for the close button. */}
        <div className="relative flex flex-col h-full overflow-y-auto p-6">
          <button
            onClick={onToggle}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
            aria-label="Close information panel"
          >
            <CloseIcon />
          </button>

          <h2 id="info-panel-title" className="text-2xl font-bold text-gray-900 mb-4 pr-8">
            {info.title}
          </h2>
          
          <div className="space-y-5 text-gray-700">
            <p className="text-base leading-relaxed">{info.description}</p>
            
            {info.formula && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Formula</h3>
                <p className="text-sm font-mono bg-gray-100 p-3 rounded-md text-gray-800">{info.formula}</p>
                {info.note && (
                  <p className="text-xs text-gray-600 italic mt-2">{info.note}</p>
                )}
              </div>
            )}

            {info.variables && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Variables</h3>
                <ul className="text-sm list-none space-y-2 bg-gray-50 p-3 rounded-md">
                  {Object.entries(info.variables).map(([key, value]) => (
                    <li key={key} className="flex">
                      <strong className="font-mono w-12 flex-shrink-0">{key}:</strong>
                      <span>{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {info.dataSources && info.dataSources.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Data Sources</h3>
                <ul className="text-sm list-none space-y-1">
                  {info.dataSources.map((source) => (
                    <li key={source.name}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-words">
                        {source.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default InfoAccordion;