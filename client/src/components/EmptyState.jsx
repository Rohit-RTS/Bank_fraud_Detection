// client/src/components/EmptyState.jsx
import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'No records found', icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="p-4 bg-slate-800/60 rounded-full">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
