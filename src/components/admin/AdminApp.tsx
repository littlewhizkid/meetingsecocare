'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AdminRoomsPanel } from './AdminRoomsPanel';
import { AdminUsersPanel } from './AdminUsersPanel';

type Tab = 'rooms' | 'users';

export function AdminApp() {
  const [activeTab, setActiveTab] = useState<Tab>('rooms');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Admin Panel</h1>
              <p className="text-xs text-gray-500">ecoCare Meeting Rooms</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to App
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {(['rooms', 'users'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'rooms' ? '🏢 Rooms' : '👥 Users'}
            </button>
          ))}
        </div>

        {activeTab === 'rooms' && <AdminRoomsPanel />}
        {activeTab === 'users' && <AdminUsersPanel />}
      </div>
    </div>
  );
}
