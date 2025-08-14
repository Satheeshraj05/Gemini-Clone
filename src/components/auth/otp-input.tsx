import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface OtpInputProps {
  value: string;
  valueLength: number;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const OtpInput = ({
  value,
  valueLength,
  onChange,
  disabled = false,
  className = '',
}: OtpInputProps) => {
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Focus on the first input when the component mounts
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = value.split('');
    newValue[index] = e.target.value.slice(-1); // Get only the last character
    
    // Update the OTP value
    const otp = newValue.join('');
    onChange(otp);

    // Move to next input if there's a value, or to previous if backspace was pressed
    if (e.target.value && index < valueLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key down for backspace and arrow keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Move left with left arrow
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < valueLength - 1) {
      // Move right with right arrow
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, valueLength);
    
    if (/^\d+$/.test(pastedData)) {
      onChange(pastedData);
      
      // Focus on the next empty input or the last one if all are filled
      const nextIndex = Math.min(pastedData.length, valueLength - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      {Array.from({ length: valueLength }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => {
            if (el) {
              inputRefs.current[index] = el;
            }
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className="h-12 w-12 text-center text-xl font-semibold"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};
