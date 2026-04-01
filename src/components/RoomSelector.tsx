'use client';
import { Room } from '@/types';

interface Props {
  rooms: Room[];
  selectedRoomId: string;
  onSelect: (roomId: string) => void;
}

export function RoomSelector({ rooms, selectedRoomId, onSelect }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {rooms.map(room => {
        const isSelected = room.id === selectedRoomId;
        return (
          <button
            key={room.id}
            onClick={() => onSelect(room.id)}
            className={`flex-shrink-0 flex items-center gap-3 px-5 py-4 rounded-2xl border-2 transition-all duration-150 text-left ${
              isSelected
                ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-200'
                : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50'
            }`}
          >
            <span className="text-2xl">{room.icon}</span>
            <div>
              <div className="font-semibold text-sm leading-tight">{room.name}</div>
              <div className={`text-xs mt-0.5 ${isSelected ? 'text-green-100' : 'text-gray-400'}`}>
                {room.capacity}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
