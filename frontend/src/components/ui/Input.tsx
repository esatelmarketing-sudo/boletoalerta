import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors
          ${error ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}
          disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors bg-white
          ${error ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
);
Select.displayName = "Select";
