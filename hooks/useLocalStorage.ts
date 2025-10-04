import { useState, useEffect, useCallback } from 'react';

/**
 * LocalStorageに値を保存・読み込みするカスタムフック
 *
 * @param key - LocalStorageのキー
 * @param initialValue - 初期値（LocalStorageに値がない場合に使用）
 * @returns [value, setValue] - 現在の値と値を更新する関数
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // LocalStorageから初期値を読み込む
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 値を更新してLocalStorageに保存する
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // 関数が渡された場合は現在の値を引数に呼び出す
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * 複数の状態をまとめてLocalStorageに保存・読み込みするカスタムフック
 * ページリロード時に状態を自動復元するために使用
 *
 * @param key - LocalStorageのキー
 * @param initialState - 初期状態オブジェクト
 * @returns [state, updateState, clearState] - 現在の状態、状態を更新する関数、状態をクリアする関数
 */
export function usePersistedState<T extends Record<string, any>>(
  key: string,
  initialState: T
): [T, (updates: Partial<T>) => void, () => void] {
  const [state, setState] = useLocalStorage<T>(key, initialState);

  // 部分的に状態を更新する
  const updateState = useCallback((updates: Partial<T>) => {
    setState((prev) => ({
      ...prev,
      ...updates,
    }));
  }, [setState]);

  // 状態をクリアして初期値に戻す
  const clearState = useCallback(() => {
    setState(initialState);
  }, [setState, initialState]);

  return [state, updateState, clearState];
}
