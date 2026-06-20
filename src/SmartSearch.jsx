import React, { useState } from 'react';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { videoData } from './data.js';

export const SmartSearch = ({ onSearchResults, onClearSearch, onSearchStart }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      onClearSearch();
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      setError('Please set VITE_GEMINI_API_KEY in .env.local');
      return;
    }

    setIsSearching(true);
    setError('');
    if (onSearchStart) {
      onSearchStart();
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash',
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                reason: { type: SchemaType.STRING }
              },
              required: ["id", "reason"]
            }
          }
        }
      });

      // Create a simplified version of data for the prompt to save tokens
      const searchableData = videoData.map(v => ({
        id: `${v.VidID}_${v.video_class}`, // Unique identifier
        title: v.video_title,
        description: v.Description,
        tier: v.video_class
      }));

      const prompt = `You are an expert medical search assistant for a spine video library.
The user's search query is: "${query}"

Here is the catalog of available videos:
${JSON.stringify(searchableData, null, 2)}

Your task is to perform a deep semantic search. 
1. Deeply analyze the user's intent.
2. Carefully read the "description" and "title" of each video.
3. Match videos even if they don't use the exact keywords (e.g. if the user searches for "neck pain", consider cervical spine videos; if they search for "front", consider "anterior" approaches).
4. Return a JSON array of objects containing the matched video "id"s and a brief "reason" for why it's highly relevant. Order the results from most relevant to least relevant.
If no videos match well semantically, return an empty array.`;

      const response = await model.generateContent(prompt);
      const responseText = response.response.text();
      
      // Parse the JSON output
      let matchedIds = [];
      try {
        const cleanedText = responseText.replace(/^```json/m, '').replace(/```$/m, '').trim();
        const result = JSON.parse(cleanedText);
        if (Array.isArray(result)) {
            matchedIds = result.map(item => item.id);
        }
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", responseText);
        throw new Error("Invalid response from search AI.");
      }

      const results = videoData.filter(v => matchedIds.includes(`${v.VidID}_${v.video_class}`));
      onSearchResults(results);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="smart-search-container">
      <form onSubmit={handleSearch} className="smart-search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === '') {
              onClearSearch();
            }
          }}
          placeholder="Smart Search (e.g. 'surgery from the front')"
          className="smart-search-input"
        />
        {query && (
          <button 
            type="button" 
            className="smart-search-clear" 
            onClick={() => {
              setQuery('');
              onClearSearch();
            }}
            style={{background: 'none', border: 'none', color: 'white', opacity: 0.5, cursor: 'pointer', padding: '0 8px'}}
          >
            ✕
          </button>
        )}
        <button type="submit" disabled={isSearching} className="smart-search-button">
          {isSearching ? '...' : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>}
        </button>
      </form>
      {error && <div className="smart-search-error">{error}</div>}
    </div>
  );
};
