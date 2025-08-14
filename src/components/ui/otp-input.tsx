import * as React from 'react';
import { cn } from '@/lib/utils';

export interface OTPInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  valueLength?: number;
  onChange: (value: string) => void;
}

export function OTPInput({
  value,
  valueLength = 6,
  onChange,
  className,
  ...props
}: OTPInputProps) {
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  const valueItems = React.useMemo(() => {
    const valueArray = value.split('');
    const items: string[] = [];

    for (let i = 0; i < valueLength; i++) {
      const char = valueArray[i];
      items.push(char ?? '');
    }

    return items;
  }, [value, valueLength]);

  const focusToNextInput = (target: HTMLElement) => {
    const nextElementSibling = target.nextElementSibling as HTMLInputElement | null;
    if (nextElementSibling) {
      nextElementSibling.focus();
    }
  };

  const focusToPrevInput = (target: HTMLElement) => {
    const previousElementSibling = target.previousElementSibling as HTMLInputElement | null;
    if (previousElementSibling) {
      previousElementSibling.focus();
    }
  };

  const inputOnChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const target = e.target;
    let targetValue = target.value.trim();
    const isTargetValueDigit = /\d/.test(targetValue);

    if (!isTargetValueDigit && targetValue !== '') {
      return;
    }

    targetValue = isTargetValueDigit ? targetValue : ' ';

    const targetValueLength = targetValue.length;

    if (targetValueLength === 1) {
      const newValue =
        value.substring(0, idx) + targetValue + value.substring(idx + 1);
      onChange(newValue);

      if (!isTargetValueDigit) {
        return;
      }

      focusToNextInput(target);
    } else if (targetValueLength === valueLength) {
      onChange(targetValue);
      target.blur();
    }
  };

  const inputOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;
    const target = e.target as HTMLInputElement;
    const targetValue = target.value;
    const idx = parseInt(target.dataset.idx || '0');

    if (key === 'ArrowRight' || key === 'ArrowDown') {
      e.preventDefault();
      focusToNextInput(target);
    }

    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      e.preventDefault();
      focusToPrevInput(target);
    }

    if (key === 'Backspace') {
      e.preventDefault();
      const newValue = value.substring(0, idx) + ' ' + value.substring(idx + 1);
      onChange(newValue);
      focusToPrevInput(target);
    }

    if (key === 'Delete') {
      e.preventDefault();
      const newValue = value.substring(0, idx) + ' ' + value.substring(idx + 1);
      onChange(newValue);
    }

    // Only allow numbers
    if (key === 'e' || key === '+' || key === '-' || key === '.') {
      e.preventDefault();
    }
  };

  const inputOnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { target } = e;
    target.select();
  };

  const inputOnPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const pastedDataNumeric = pastedData.replace(/\D/g, '');
    
    if (pastedDataNumeric.length > 0) {
      const newValue = pastedDataNumeric.substring(0, valueLength);
      onChange(newValue);
      
      // Focus the last input
      const lastInput = inputRefs.current[Math.min(newValue.length, valueLength - 1)];
      if (lastInput) {
        lastInput.focus();
      }
    }
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {Array.from({ length: valueLength }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            if (el) {
              inputRefs.current[index] = el;
            }
            return undefined;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{1}"
          maxLength={1}
          value={valueItems[index] || ''}
          onChange={(e) => inputOnChange(e, index)}
          onKeyDown={inputOnKeyDown}
          onFocus={inputOnFocus}
          onPaste={index === 0 ? inputOnPaste : undefined}
          data-idx={index}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-md border border-input bg-background text-center text-xl shadow-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          disabled={props.disabled}
        />
      ))}
    </div>
  );
}
