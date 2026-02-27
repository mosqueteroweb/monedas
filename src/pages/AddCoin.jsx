import React, { useState } from 'react';
import { Camera, ArrowLeft, ArrowRight, Save, Loader, Scissors } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/imageUtils';
import { identifyCoin, detectCoinBoundingBox } from '../utils/gemini';
import { cropImage } from '../utils/imageProcessing';
import { db } from '../db';

export default function AddCoin() {
  const navigate = useNavigate();
  const [step, setStep] = useState('capture'); // capture, processing_crop, analyzing, verify
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cropStatus, setCropStatus] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    country: '',
    year: '',
    denomination: '',
    mintMark: ''
  });

  const handleImageChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcessing(true);
    try {
      const compressedBlob = await compressImage(file);
      if (type === 'front') {
        setFrontImage(compressedBlob);
      } else {
        setBackImage(compressedBlob);
      }
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Error al procesar la imagen.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!frontImage || !backImage) return;

    // Step 1: Detect and Crop
    setStep('processing_crop');
    let finalFront = frontImage;
    let finalBack = backImage;

    try {
      setCropStatus('Detectando moneda en anverso...');
      const frontBBox = await detectCoinBoundingBox(frontImage);
      if (frontBBox) {
        setCropStatus('Recortando anverso...');
        finalFront = await cropImage(frontImage, frontBBox);
        setFrontImage(finalFront); // Update state with cropped image
      }

      setCropStatus('Detectando moneda en reverso...');
      const backBBox = await detectCoinBoundingBox(backImage);
      if (backBBox) {
        setCropStatus('Recortando reverso...');
        finalBack = await cropImage(backImage, backBBox);
        setBackImage(finalBack); // Update state with cropped image
      }
    } catch (cropError) {
      console.warn("Error during auto-crop:", cropError);
      // Continue with original images if cropping fails
    }

    // Step 2: Analyze Data
    setStep('analyzing');
    setCropStatus('');

    try {
      const data = await identifyCoin(finalFront, finalBack);
      setFormData({
        country: data.country || '',
        year: data.year || '',
        denomination: data.denomination || '',
        mintMark: data.mintMark || ''
      });
      setStep('verify');
    } catch (error) {
      console.error('Error analyzing coin:', error);
      alert(`Error al analizar la moneda: ${error.message}`);
      setStep('capture'); // Go back to capture on error
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await db.coins.add({
        country: formData.country,
        year: formData.year,
        denomination: formData.denomination,
        mintMark: formData.mintMark,
        frontImage: frontImage,
        backImage: backImage,
        createdAt: new Date(),
        valueChecked: false,
        marketValue: null
      });
      navigate('/');
    } catch (error) {
      console.error('Error saving coin:', error);
      alert('Error al guardar en la base de datos.');
    }
  };

  if (step === 'processing_crop') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <Scissors className="animate-bounce text-blue-600 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-800">Procesando Imágenes...</h2>
        <p className="text-gray-500 mt-2">{cropStatus || 'Optimizando recortes...'}</p>
      </div>
    );
  }

  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <Loader className="animate-spin text-blue-600 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-800">Analizando Moneda...</h2>
        <p className="text-gray-500 mt-2">La IA está extrayendo los datos de tus imágenes. Esto puede tardar unos segundos.</p>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => setStep('capture')} className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Verificar Datos</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
             <img src={URL.createObjectURL(frontImage)} className="w-full h-full object-contain" alt="Anverso" />
          </div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
             <img src={URL.createObjectURL(backImage)} className="w-full h-full object-contain" alt="Reverso" />
          </div>
        </div>

        <p className="text-xs text-center text-gray-500 mb-4 flex items-center justify-center gap-1">
          <Scissors size={12} /> Imágenes recortadas automáticamente
        </p>

        <form onSubmit={handleSave} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
            <input
              type="text"
              required
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input
                type="text" // text allows "N.D." or approx
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ceca (Marca)</label>
              <input
                type="text"
                value={formData.mintMark}
                onChange={(e) => setFormData({...formData, mintMark: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Denominación</label>
            <input
              type="text"
              required
              value={formData.denomination}
              onChange={(e) => setFormData({...formData, denomination: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow flex justify-center items-center gap-2 transition-transform active:scale-95"
          >
            <Save size={20} />
            Guardar en Catálogo
          </button>
        </form>
      </div>
    );
  }

  // Step: capture
  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center mb-6">
        <Link to="/" className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-xl font-bold text-gray-800">Añadir Moneda</h2>
      </div>

      <div className="space-y-6">
        {/* Front Image */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
            Anverso (Cara)
          </h3>
          <div className="flex flex-col items-center">
            {frontImage ? (
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={URL.createObjectURL(frontImage)}
                  alt="Anverso"
                  className="w-full h-full object-contain"
                  onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                />
                <button
                  onClick={() => setFrontImage(null)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 p-1.5 rounded-full text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                <div className="bg-gray-100 p-4 rounded-full mb-3 group-hover:bg-blue-100 transition-colors">
                   <Camera size={32} className="text-gray-400 group-hover:text-blue-500" />
                </div>
                <span className="text-sm text-gray-500 font-medium group-hover:text-blue-600">Capturar Anverso</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageChange(e, 'front')}
                />
              </label>
            )}
          </div>
        </div>

        {/* Back Image */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
            Reverso (Cruz)
          </h3>
           <div className="flex flex-col items-center">
            {backImage ? (
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={URL.createObjectURL(backImage)}
                  alt="Reverso"
                  className="w-full h-full object-contain"
                  onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                />
                <button
                  onClick={() => setBackImage(null)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 p-1.5 rounded-full text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                <div className="bg-gray-100 p-4 rounded-full mb-3 group-hover:bg-blue-100 transition-colors">
                   <Camera size={32} className="text-gray-400 group-hover:text-blue-500" />
                </div>
                <span className="text-sm text-gray-500 font-medium group-hover:text-blue-600">Capturar Reverso</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageChange(e, 'back')}
                />
              </label>
            )}
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!frontImage || !backImage || processing}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
            ${(!frontImage || !backImage || processing)
              ? 'bg-gray-300 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95 hover:shadow-xl'
            }`}
        >
          {processing ? 'Procesando...' : (
            <>
              Analizar Moneda <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
