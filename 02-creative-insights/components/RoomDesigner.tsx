import React, { useState, useEffect } from 'react';
import { generateRoomPersonalization, generateSeasonalVariations, SEASONAL_THEMES } from '../services/geminiService';

const ROOM_OPTIONS = [
  { label: 'Modern Living Room', value: '/images/room/room1.jpg' },
  { label: 'Cozy Apartment', value: '/images/room/room2.jpg' },
];

const COUCH_OPTIONS = [
  { label: 'Classic Couch (Grey)', value: '/images/couch/couch1.png' },
  { label: 'Modern Sofa (Blue)', value: '/images/couch/couch2.png' },
  { label: 'Sectional (Beige)', value: '/images/couch/couch3.png' },
];

const TABLE_OPTIONS = [
  { label: 'Coffee Table (Wood)', value: '/images/table/table1.png' },
  { label: 'Side Table (Metal)', value: '/images/table/table2.png' },
  { label: 'Round Table (Glass)', value: '/images/table/table3.png' },
];

const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface StepStatus {
  step: string;
  status: 'pending' | 'success' | 'error' | 'idle';
  message: string;
  image: string | null;
}

interface SeasonalResult {
  theme: string;
  image: string | null;
}

export const RoomDesigner: React.FC = () => {
  const [selectedRoomUrl, setSelectedRoomUrl] = useState(ROOM_OPTIONS[0].value);
  const [selectedCouchUrl, setSelectedCouchUrl] = useState(COUCH_OPTIONS[0].value);
  const [selectedTableUrl, setSelectedTableUrl] = useState(TABLE_OPTIONS[0].value);

  const [roomBase64, setRoomBase64] = useState<string | null>(null);
  const [couchBase64, setCouchBase64] = useState<string | null>(null);
  const [tableBase64, setTableBase64] = useState<string | null>(null);

  const [couchStep, setCouchStep] = useState<StepStatus>({ step: 'Place Couch', status: 'idle', message: 'Waiting to start...', image: null });
  const [tableStep, setTableStep] = useState<StepStatus>({ step: 'Add Table', status: 'idle', message: 'Waiting for couch...', image: null });

  const [seasonalResults, setSeasonalResults] = useState<SeasonalResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    handleLoadImage(selectedRoomUrl, setRoomBase64);
    handleLoadImage(selectedCouchUrl, setCouchBase64);
    handleLoadImage(selectedTableUrl, setTableBase64);
  }, []);

  const handleLoadImage = async (url: string, setter: (val: string) => void) => {
    try {
      const base64 = await urlToBase64(url);
      setter(base64);
    } catch (e) {
      console.error("Failed to load image", e);
    }
  };

  const handleGenerate = async () => {
    if (!roomBase64 || !couchBase64 || !tableBase64) return;
    setIsProcessing(true);
    setCouchStep({ step: 'Place Couch', status: 'pending', message: 'Initializing...', image: null });
    setTableStep({ step: 'Add Table', status: 'idle', message: 'Pending...', image: null });
    setSeasonalResults([]);

    try {
      // Step 1 & 2: Personalization Pipeline
      const finalRoomImage = await generateRoomPersonalization(
        couchBase64,
        tableBase64,
        roomBase64,
        (step, image, status, message) => {
          if (step === 'couch') {
            setCouchStep({ step: 'Place Couch', status, message: message || '', image });
          } else if (step === 'table') {
            setTableStep({ step: 'Add Table', status, message: message || '', image });
          }
        }
      );

      if (finalRoomImage) {
        // Step 3: Seasonal Variations
        const variations = await generateSeasonalVariations(finalRoomImage);
        setSeasonalResults(variations);
      }

    } catch (error) {
      console.error(error);
      alert("Process failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-10">
        <h2 className="section-header justify-center mb-2">Magic Room Personalization</h2>
        <p className="text-subtext">Build a room step-by-step with AI-audited placement.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Inputs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Room Select */}
          <div className="content-card">
            <h3 className="form-label mb-2 text-sm">1. Select Room</h3>
            <select
              value={selectedRoomUrl}
              onChange={(e) => { setSelectedRoomUrl(e.target.value); handleLoadImage(e.target.value, setRoomBase64); }}
              className="input-field mb-2 text-sm"
            >
              {ROOM_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <img src={selectedRoomUrl} alt="Room" className="w-full h-32 object-cover rounded-lg" />
          </div>

          {/* Couch Select */}
          <div className="content-card">
            <h3 className="form-label mb-2 text-sm">2. Select Couch</h3>
            <select
              value={selectedCouchUrl}
              onChange={(e) => { setSelectedCouchUrl(e.target.value); handleLoadImage(e.target.value, setCouchBase64); }}
              className="input-field mb-2 text-sm"
            >
              {COUCH_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div className="w-full h-32 bg-gray-900 rounded-lg flex items-center justify-center p-2 border border-gray-800">
              <img src={selectedCouchUrl} alt="Couch" className="max-w-full max-h-full object-contain" />
            </div>
          </div>

          {/* Table Select */}
          <div className="content-card">
            <h3 className="form-label mb-2 text-sm">3. Select Table</h3>
            <select
              value={selectedTableUrl}
              onChange={(e) => { setSelectedTableUrl(e.target.value); handleLoadImage(e.target.value, setTableBase64); }}
              className="input-field mb-2 text-sm"
            >
              {TABLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div className="w-full h-32 bg-gray-900 rounded-lg flex items-center justify-center p-2 border border-gray-800">
              <img src={selectedTableUrl} alt="Table" className="max-w-full max-h-full object-contain" />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!roomBase64 || !couchBase64 || !tableBase64 || isProcessing}
            className="w-full btn-primary py-3 rounded-full font-bold disabled:opacity-50 transition-colors shadow-lg"
          >
            {isProcessing ? 'Building Room...' : 'Generate Personalization'}
          </button>
        </div>

        {/* Right: Pipeline Output */}
        <div className="lg:col-span-3 space-y-8">

          {/* Pipeline Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1 Card */}
            <div className={`border-2 rounded-xl p-4 transition-colors ${couchStep.status === 'pending' ? 'border-white bg-[#111]' : 'border-gray-800 bg-[#111]'}`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-white">Step 1: Place Couch</h4>
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${couchStep.status === 'success' ? 'bg-green-900 text-green-300' :
                  couchStep.status === 'error' ? 'bg-red-900 text-red-300' :
                    couchStep.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-800 text-gray-400'
                  }`}>{couchStep.status}</span>
              </div>
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3 relative group cursor-zoom-in">
                {couchStep.image ? (
                  <img
                    src={couchStep.image}
                    className="w-full h-full object-cover"
                    onClick={() => setLightboxImage(couchStep.image)}
                  />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">Waiting...</div>
                )}
                {couchStep.status === 'pending' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 h-10 overflow-y-auto">{couchStep.message}</p>
            </div>

            {/* Step 2 Card */}
            <div className={`border-2 rounded-xl p-4 transition-colors ${tableStep.status === 'pending' ? 'border-white bg-[#111]' : 'border-gray-800 bg-[#111]'}`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-white">Step 2: Add Table</h4>
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${tableStep.status === 'success' ? 'bg-green-900 text-green-300' :
                  tableStep.status === 'error' ? 'bg-red-900 text-red-300' :
                    tableStep.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-800 text-gray-400'
                  }`}>{tableStep.status}</span>
              </div>
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3 relative group cursor-zoom-in">
                {tableStep.image ? (
                  <img
                    src={tableStep.image}
                    className="w-full h-full object-cover"
                    onClick={() => setLightboxImage(tableStep.image)}
                  />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">Waiting...</div>
                )}
                {tableStep.status === 'pending' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 h-10 overflow-y-auto">{tableStep.message}</p>
            </div>
          </div>

          {/* Seasonal Grid */}
          {seasonalResults.length > 0 && (
            <div className="animate-fade-in">
              <h3 className="font-bold text-xl text-white mb-4">Step 3: Seasonal Variations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {seasonalResults.map((res, i) => (
                  <div key={i} className="content-card p-3">
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-2 cursor-zoom-in group">
                      {res.image ? (
                        <img
                          src={res.image}
                          alt={res.theme}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                          onClick={() => res.image && setLightboxImage(res.image)}
                        />
                      ) : (
                          <div className="h-full flex items-center justify-center text-gray-500">Failed</div>
                      )}
                    </div>
                    <p className="text-center font-bold text-white text-sm">{res.theme}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
              onClick={() => setLightboxImage(null)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img
              src={lightboxImage}
              alt="Full view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

      </div>
    </div>
  );
};
