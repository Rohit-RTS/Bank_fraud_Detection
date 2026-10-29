// client/src/components/FormInput.jsx
export default function FormInput({ label, error, required, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {props.type === 'textarea' ? (
        <textarea
          {...props}
          rows={props.rows || 3}
          className={`px-3 py-2 bg-[#0a1628] border rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none ${error ? 'border-red-500' : 'border-slate-700'}`}
        />
      ) : (
        <input
          {...props}
          className={`px-3 py-2 bg-[#0a1628] border rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors ${error ? 'border-red-500' : 'border-slate-700'}`}
        />
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
