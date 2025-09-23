
import React, { useState } from 'react';
import { LockClosedIcon, SparklesIcon } from './Icon';

interface PinAuthProps {
  onAuthSuccess: () => void;
  verifyPin: (pin: string) => Promise<boolean>;
}

const PinAuth: React.FC<PinAuthProps> = ({ onAuthSuccess, verifyPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and limit to 6 digits
    if (/^\d*$/.test(value) && value.length <= 6) {
      setPin(value);
      setError(''); // Clear error on new input
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('6桁の暗証番号を入力してください。');
      return;
    }
    setIsLoading(true);
    setError('');
    
    const isCorrect = await verifyPin(pin);

    setIsLoading(false);
    if (isCorrect) {
      onAuthSuccess();
    } else {
      setError('暗証番号が正しくありません。');
      setPin(''); // Clear pin on failure
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
            <div className="flex items-center justify-center mb-4">
                <SparklesIcon className="h-10 w-10 text-indigo-600" />
                <h1 className="ml-3 text-3xl font-bold text-gray-800 tracking-tight">
                AIリノベーション
                </h1>
            </div>
            <p className="text-gray-600">6桁の暗証番号を入力してください</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="flex items-center justify-center">
                <input
                    id="pin"
                    name="pin"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={pin}
                    onChange={handlePinChange}
                    maxLength={6}
                    className="text-center text-3xl tracking-[1em] w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="------"
                    disabled={isLoading}
                />
            </div>
          </div>

          {error && (
            <p className="text-center text-red-500 text-sm">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || pin.length !== 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LockClosedIcon className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
              </span>
              {isLoading ? '確認中...' : '認証'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinAuth;
