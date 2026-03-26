import { Room } from '../types';

type Props = {
  rooms: Room[];
  selectedRoomId: string;
  onSelect: (roomId: string) => void;
};

export const RoomSelector = ({ rooms, selectedRoomId, onSelect }: Props) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {rooms.map((room) => {
        const active = room.id === selectedRoomId;
        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelect(room.id)}
            className={`rounded-xl border p-4 text-left transition ${
              active
                ? 'border-eco-600 bg-eco-50 ring-2 ring-eco-100 dark:border-eco-500 dark:bg-slate-800'
                : 'border-slate-200 bg-white hover:border-eco-200 hover:bg-eco-50/40 dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            <div className="text-2xl">{room.icon}</div>
            <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">{room.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tap to view room schedule</p>
          </button>
        );
      })}
    </div>
  );
};
