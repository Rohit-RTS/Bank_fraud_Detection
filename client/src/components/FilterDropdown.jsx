// client/src/components/FilterDropdown.jsx
export default function FilterDropdown({ value, onChange, options, placeholder = 'All' }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 bg-[#0f2040] border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
