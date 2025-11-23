import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, User, Sparkles, Edit3, Save, RefreshCw, ChevronRight, ChevronLeft, Send, Trash2, Plus } from 'lucide-react';

// --- API HANDLING ---
// The environment injects the key at runtime.
const apiKey = import.meta.env.VITE_API_KEY 

const generateStoryContent = async (prompt, systemInstruction = "") => {
  if (!apiKey) {
    throw new Error("API Key not found in environment.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "API request failed");
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated.";
  } catch (error) {
    console.error("Generation error:", error);
    throw error;
  }
};

// --- COMPONENTS ---

const StepIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex items-center justify-center space-x-2 mb-8">
    {[...Array(totalSteps)].map((_, i) => (
      <div
        key={i}
        className={`h-2 rounded-full transition-all duration-300 ${
          i + 1 === currentStep ? "w-8 bg-indigo-600" : "w-2 bg-gray-300"
        }`}
      />
    ))}
  </div>
);

const CharacterForm = ({ index, character, updateCharacter, removeCharacter }) => {
  const personalities = ["Calm", "Anxious", "Energetic", "Stoic", "Cheerful", "Cynical", "Brave", "Cowardly", "Mysterious"];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-700 flex items-center">
          <User size={16} className="mr-2 text-indigo-500" /> Character {index + 1}
        </h4>
        {index > 0 && (
          <button onClick={() => removeCharacter(index)} className="text-red-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
          <input
            type="text"
            value={character.name}
            onChange={(e) => updateCharacter(index, 'name', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-200 outline-none"
            placeholder="e.g. Neo"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
          <select
            value={character.gender}
            onChange={(e) => updateCharacter(index, 'gender', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-200 outline-none"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Personality</label>
          <select
            value={character.personality}
            onChange={(e) => updateCharacter(index, 'personality', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-200 outline-none"
          >
            {personalities.map(p => <option key={p} value={p}>{p}</option>)}
            <option value="Custom">Custom...</option>
          </select>
          {character.personality === "Custom" && (
             <input
             type="text"
             onChange={(e) => updateCharacter(index, 'customPersonality', e.target.value)}
             className="w-full mt-2 p-2 border border-gray-300 rounded text-sm"
             placeholder="Describe personality"
           />
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for Story Configuration
  const [config, setConfig] = useState({
    genre: 'Fantasy',
    plotOutline: '',
  });

  const [characters, setCharacters] = useState([
    { name: '', gender: 'Male', personality: 'Brave' }
  ]);

  // State for Generated Content
  const [story, setStory] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState("");

  // Handlers
  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const addCharacter = () => {
    setCharacters([...characters, { name: '', gender: 'Male', personality: 'Calm' }]);
  };

  const updateCharacter = (index, field, value) => {
    const newChars = [...characters];
    if (field === 'customPersonality') {
        newChars[index].personalityRaw = value; // Store custom input
    } else {
        newChars[index][field] = value;
    }
    setCharacters(newChars);
  };

  const removeCharacter = (index) => {
    const newChars = characters.filter((_, i) => i !== index);
    setCharacters(newChars);
  };

  const getEffectivePersonality = (char) => {
      return char.personality === 'Custom' ? (char.personalityRaw || 'Complex') : char.personality;
  };

  const generateStory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Constructing the system prompt
      const charDescription = characters.map(c => 
        `- Name: ${c.name || 'Unknown'}, Gender: ${c.gender}, Personality: ${getEffectivePersonality(c)}`
      ).join('\n');

      const fullPrompt = `
        Genre: ${config.genre}
        
        Characters:
        ${charDescription}
        
        Plot Outline provided by user:
        "${config.plotOutline}"

        Task:
        Write a compelling story based on the genre and plot outline above. 
        Focus heavily on how the specific personalities of the characters influence their dialogue and actions.
        The characters should feel distinct.
        If the plot outline is thin, expand on it creatively while staying true to the genre.
      `;

      const result = await generateStoryContent(fullPrompt, "You are a creative writing assistant specialized in character-driven storytelling.");
      setStory(result);
      setStep(4); // Move to result view
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refineStory = async () => {
    if (!refinementPrompt) return;
    setLoading(true);
    try {
      const refinementRequest = `
        Original Story:
        ${story}

        User Request for Changes:
        "${refinementPrompt}"

        Task:
        Rewrite the story or specific sections to accommodate the user's request. Maintain the established characters.
      `;
      const result = await generateStoryContent(refinementRequest, "You are an expert editor.");
      setStory(result);
      setRefinementPrompt("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER STEPS ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Choose your Genre</h2>
        <p className="text-gray-500">Set the tone for your adventure.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {['Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Horror', 'Cyberpunk', 'Western', 'Comedy'].map((g) => (
          <button
            key={g}
            onClick={() => handleConfigChange('genre', g)}
            className={`p-4 rounded-xl border-2 transition-all ${
              config.genre === g 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-md' 
                : 'border-gray-200 hover:border-indigo-300 text-gray-600'
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 animate-fade-in">
       <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Cast your Characters</h2>
        <p className="text-gray-500">Who is playing the lead roles?</p>
      </div>

      <div className="max-h-[50vh] overflow-y-auto pr-2">
        {characters.map((char, idx) => (
          <CharacterForm 
            key={idx} 
            index={idx} 
            character={char} 
            updateCharacter={updateCharacter}
            removeCharacter={removeCharacter} 
          />
        ))}
      </div>

      <button 
        onClick={addCharacter}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 flex items-center justify-center transition-colors"
      >
        <Plus size={20} className="mr-2" /> Add Another Character
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">The Plot Outline</h2>
        <p className="text-gray-500">Give the AI a spark to start the fire.</p>
      </div>

      <textarea
        value={config.plotOutline}
        onChange={(e) => handleConfigChange('plotOutline', e.target.value)}
        className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-gray-700"
        placeholder="e.g. Two strangers meet on a train that never stops. One is hiding a secret that could save the world..."
      />
      
      <div className="bg-indigo-50 p-4 rounded-lg text-sm text-indigo-800 flex items-start">
        <Sparkles size={16} className="mt-1 mr-2 flex-shrink-0" />
        <p>Tip: You don't need to write the whole story. Just describe the conflict, the setting, or the goal, and the AI will do the rest!</p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <BookOpen size={20} className="mr-2 text-indigo-600" />
          {config.genre} Story
        </h2>
        <div className="flex space-x-2">
           <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Manual Edit"
          >
            {isEditing ? <Save size={18}/> : <Edit3 size={18} />}
          </button>
        </div>
      </div>

      {/* Story Display/Editor Area */}
      <div className="flex-grow bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-y-auto mb-4 custom-scrollbar">
        {isEditing ? (
          <textarea 
            className="w-full h-full outline-none resize-none font-serif text-lg leading-relaxed text-gray-800"
            value={story}
            onChange={(e) => setStory(e.target.value)}
          />
        ) : (
          <div className="prose max-w-none font-serif text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
            {story}
          </div>
        )}
      </div>

      {/* Refinement Area */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          AI Refinement
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && refineStory()}
            placeholder="e.g. 'Make the ending more dramatic' or 'Make Neo more sarcastic'"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button 
            onClick={refineStory}
            disabled={loading || !refinementPrompt}
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
      
      <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-500 hover:text-indigo-600 text-center w-full">
        Start New Story
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col relative">
        
        {/* Header */}
        <header className="bg-indigo-600 p-6 text-white flex justify-between items-center shadow-md z-10">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Sparkles size={24} className="text-yellow-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AI StoryCraft</h1>
          </div>
          {step < 4 && <span className="text-indigo-200 text-sm font-medium">Step {step} of 3</span>}
        </header>

        {/* Main Content */}
        <main className="flex-grow p-6 md:p-8 relative">
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
              <p className="text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="text-sm text-red-500 underline mt-1">Dismiss</button>
            </div>
          )}

          {step < 4 && <StepIndicator currentStep={step} totalSteps={3} />}

          {/* Loading Overlay */}
          {loading && (
             <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-fade-in">
                <div className="relative">
                   <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                   <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={24} />
                </div>
                <p className="mt-4 text-indigo-800 font-medium animate-pulse">Weaving your tale...</p>
             </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

        </main>

        {/* Footer Navigation (Only for Steps 1-3) */}
        {step < 4 && (
          <footer className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between items-center">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
                step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft size={20} className="mr-1" /> Back
            </button>

            <button
              onClick={() => {
                if (step === 3) {
                  generateStory();
                } else {
                  setStep(s => s + 1);
                }
              }}
              disabled={loading}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center font-semibold"
            >
              {step === 3 ? (
                <>Generate Story <Sparkles size={18} className="ml-2" /></>
              ) : (
                <>Next <ChevronRight size={20} className="ml-1" /></>
              )}
            </button>
          </footer>
        )}
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c7c7c7; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0; 
        }
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}