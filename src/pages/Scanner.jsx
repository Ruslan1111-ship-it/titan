import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Camera, AlertCircle } from 'lucide-react';
import { checkIn } from '../utils/api';

const Scanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setResult(null);
      
      // Check if jsQR is loaded
      if (!window.jsQR) {
        setError('Библиотека сканирования не загружена. Перезагрузите страницу или используйте ручной ввод.');
        return;
      }
      
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setScanning(true);
          // Start QR code detection
          scanIntervalRef.current = setInterval(scanQRCode, 300);
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Не удалось получить доступ к камере. Проверьте разрешения или используйте ручной ввод.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = async () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use jsQR library for QR code detection
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          await handleScan(code.data);
        }
      }
    } catch (err) {
      console.error('Error scanning QR code:', err);
    }
  };

  const handleScan = async (uuid) => {
    stopScanning();
    
    try {
      const data = await checkIn(uuid);
      setResult({
        success: true,
        message: data.message,
        client: data.client,
        visit: data.visit,
      });
      
      // Auto-reset after 5 seconds
      setTimeout(() => {
        setResult(null);
        startScanning();
      }, 5000);
    } catch (err) {
      setResult({
        success: false,
        message: err.message,
      });
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        setResult(null);
        startScanning();
      }, 3000);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    
    await handleScan(manualInput.trim());
    setManualInput('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Сканер QR-кодов</h1>
        
        {/* Scanner Section */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex justify-center mb-4 sm:mb-6">
            {!scanning ? (
              <button
                onClick={startScanning}
                className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-base sm:text-lg w-full sm:w-auto justify-center"
              >
                <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                Начать сканирование
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="bg-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium hover:bg-red-700 transition-colors text-base sm:text-lg w-full sm:w-auto"
              >
                Остановить
              </button>
            )}
          </div>

          {scanning && (
            <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ paddingBottom: '75%' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 sm:w-64 sm:h-64 border-4 border-white rounded-lg"></div>
              </div>
            </div>
          )}

        {/* Result Display */}
        {result && (
          <div className={`mb-6 p-6 rounded-xl ${result.success ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
            <div className="flex items-center justify-center mb-4">
              {result.success ? (
                <CheckCircle className="w-16 h-16 text-green-500" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500" />
              )}
            </div>
            
            <h2 className={`text-2xl font-bold text-center mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
              {result.success ? 'Успешно!' : 'Ошибка'}
            </h2>
            
            <p className={`text-center mb-4 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.message}
            </p>

            {result.success && result.client && (
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Клиент:</span>
                  <span className="font-semibold">{result.client.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Телефон:</span>
                  <span className="font-semibold">{result.client.phone}</span>
                </div>
                {result.client.trainer_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Тренер:</span>
                    <span className="font-semibold">{result.client.trainer_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Время:</span>
                  <span className="font-semibold">{result.visit?.visit_time}</span>
                </div>
              </div>
            )}
          </div>
        )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-800 text-sm sm:text-base">{error}</p>
            </div>
          )}
        </div>

        {/* Manual Input */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 text-center">Ручной ввод UUID</h2>
          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Введите UUID клиента"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              Проверить
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="text-center text-xs sm:text-sm text-gray-500 px-4">
          <p>💡 Для работы сканера требуется доступ к камере</p>
          <p className="mt-1">Результат отобразится автоматически после сканирования</p>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
