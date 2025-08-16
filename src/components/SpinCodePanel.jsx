import React, { useState } from 'react';
import { playerAPI } from '../lib/api.js';

/**
 * SpinCodePanel Component
 * 
 * A React component that allows players to:
 * 1. Enter a 5-digit code
 * 2. Submit the code to spin the wheel
 * 3. Display the spin result with animations
 * 
 * Features:
 * - Input validation for 5-digit codes
 * - Loading states during API calls
 * - Prize display with different styling for wins/losses
 * - Error handling for invalid/expired codes
 * - Auto-focus for better UX
 */
export default function SpinCodePanel() {
  // State management
  const [code, setCode] = useState(['', '', '', '', '']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);

  /**
   * Handle individual digit input
   * @param {number} index - Input field index (0-4)
   * @param {string} value - Input value
   */
  const handleCodeChange = (index, value) => {
    // Only allow single digits
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 4) {
      const nextInput = document.getElementById(`spin-code-${index + 1}`);
      nextInput?.focus();
    }
    
    // Clear previous results when user starts typing
    if (result || error) {
      setResult(null);
      setError('');
      setShowResult(false);
    }
  };

  /**
   * Handle backspace for better UX
   * @param {number} index - Current input index
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`spin-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  /**
   * Submit code and spin the wheel
   */
  const handleSpin = async () => {
    const codeString = code.join('');
    
    // Validation
    if (codeString.length !== 5) {
      setError('Please enter a complete 5-digit code');
      return;
    }
    
    if (!/^\d{5}$/.test(codeString)) {
      setError('Code must contain only numbers');
      return;
    }

    // Reset states
    setIsSpinning(true);
    setError('');
    setResult(null);
    setShowResult(false);

    try {
      const response = await playerAPI.spin(codeString);
      
      if (response.success) {
        setResult(response);
        setShowResult(true);
        
        // Clear the code after successful spin
        setCode(['', '', '', '', '']);
        
        // Focus first input for next code
        setTimeout(() => {
          document.getElementById('spin-code-0')?.focus();
        }, 100);
      } else {
        setError(response.message || 'Spin failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to spin. Please try again.');
      console.error('Spin failed:', err);
    } finally {
      setIsSpinning(false);
    }
  };

  /**
   * Format prize for display
   * @param {number} prize - Prize amount in dollars
   */
  const formatPrize = (prize) => {
    return prize === 0 ? 'No Prize' : `$${prize}`;
  };

  /**
   * Get result styling based on outcome
   * @param {string} outcome - "win" or "lose"
   */
  const getResultStyling = (outcome) => {
    return outcome === 'win' 
      ? 'bg-green-500/20 border-green-500 text-green-200'
      : 'bg-yellow-500/20 border-yellow-500 text-yellow-200';
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-gray-300">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">
        🎰 Spin the Wheel
      </h2>
      
      {/* Code Input Fields */}
      <div className="flex justify-center gap-2 mb-6">
        {[0, 1, 2, 3, 4].map((index) => (
          <input
            key={index}
            id={`spin-code-${index}`}
            type="text"
            maxLength={1}
            value={code[index]}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isSpinning}
            className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed
                     transition-all duration-200"
            placeholder="0"
          />
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-200 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {showResult && result && (
        <div className={`mb-4 p-4 rounded-lg border ${getResultStyling(result.outcome)}`}>
          <div className="text-center">
            <p className="text-lg font-semibold mb-1">
              {result.outcome === 'win' ? '🎉 Congratulations!' : '🎲 Try Again!'}
            </p>
            <p className="text-xl font-bold mb-2">
              {formatPrize(result.prize)}
            </p>
            <p className="text-sm opacity-90">
              {result.message}
            </p>
          </div>
        </div>
      )}

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || code.join('').length !== 5}
        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 
                 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500
                 text-white font-bold text-lg rounded-lg transition-all duration-200
                 disabled:cursor-not-allowed disabled:opacity-50
                 transform hover:scale-105 active:scale-95"
      >
        {isSpinning ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            SPINNING...
          </span>
        ) : (
          'SPIN WHEEL'
        )}
      </button>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-400">
        <p>Enter your 5-digit code and click "SPIN WHEEL" to play!</p>
        <p className="mt-1 text-xs">Codes expire after 3 hours</p>
      </div>

      {/* Prize Information */}
      <div className="mt-4 p-3 bg-black/20 rounded-lg">
        <p className="text-xs text-gray-300 text-center font-semibold mb-2">Prize Distribution:</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
          <div>$100: 2% chance</div>
          <div>$50: 4% chance</div>
          <div>$25: 7% chance</div>
          <div>$10: 12% chance</div>
          <div>$5: 25% chance</div>
          <div>No Prize: 50% chance</div>
        </div>
      </div>
    </div>
  );
}
