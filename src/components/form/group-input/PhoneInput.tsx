import { useState } from "react";

interface PhoneInputProps {
  placeholder?: string;
  onChange?: (phoneNumber: string) => void;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  placeholder = "(555) 000-0000",
  onChange,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value;
    setPhoneNumber(newPhoneNumber);
    if (onChange) {
      onChange(newPhoneNumber);
    }
  };

  return (
    <div className="relative flex">
      <span className="absolute inset-y-0 left-0 flex items-center border-r border-gray-200 px-3.5 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
        +1
      </span>
      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-3 pl-[52px] pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
      />
    </div>
  );
};

export default PhoneInput;
