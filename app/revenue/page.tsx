'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Campaign {
  id: string;
  serial_number: number;
  name: string;
}

interface Click {
  clickid: string;
  created_at: string;
  campaign_name: string;
}

export default function RevenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedCampaignName, setSelectedCampaignName] = useState('');
  const [clicks, setClicks] = useState<Click[]>([]);
  const [selectedClickId, setSelectedClickId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payout, setPayout] = useState('');
  const [conversionType, setConversionType] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [clicksLoading, setClicksLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCampaigns();
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    }
  }, [status]);

  useEffect(() => {
    if (campaignSearch.trim() === '') {
      setFilteredCampaigns(campaigns.slice(0, 50));
    } else {
      const search = campaignSearch.toLowerCase();
      const filtered = campaigns.filter(c => 
        c.name.toLowerCase().includes(search) || 
        c.id.toLowerCase().includes(search) ||
        c.serial_number.toString().includes(search)
      );
      setFilteredCampaigns(filtered.slice(0, 50));
    }
  }, [campaignSearch, campaigns]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      
      setCampaigns(data.campaigns || []);
      setFilteredCampaigns((data.campaigns || []).slice(0, 50));
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      setMessage('✗ Failed to load campaigns.');
    } finally {
      setCampaignsLoading(false);
    }
  };

  const fetchClicks = async () => {
    if (!selectedCampaign || !startDate || !endDate) return;

    setClicksLoading(true);
    try {
      const response = await fetch('/api/clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: selectedCampaign,
          date_from: startDate,
          date_to: endDate,
        }),
      });

      const data = await response.json();
      setClicks(data.clicks || []);
      
      if (data.clicks && data.clicks.length > 0) {
        setSelectedClickId(data.clicks[0].clickid);
      }
    } catch (error) {
      console.error('Failed to fetch clicks:', error);
      setMessage('✗ Failed to load clicks.');
    } finally {
      setClicksLoading(false);
    }
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign.id);
    setSelectedCampaignName(`#${campaign.serial_number} - ${campaign.name}`);
    setCampaignSearch('');
    setShowDropdown(false);
    setClicks([]);
    setSelectedClickId('');
  };

  const handleCampaignInputClick = () => {
    setShowDropdown(true);
    setCampaignSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/update-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: selectedCampaign,
          clickid: selectedClickId,
          payout: parseFloat(payout),
          type: conversionType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ Revenue updated successfully!');
        setPayout('');
        setConversionType('');
      } else {
        setMessage(`✗ Error: ${data.error || 'Failed to update revenue'}`);
      }
    } catch (error) {
      setMessage('✗ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const inputClass = "w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition text-gray-900 bg-white";

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-white transition"
            >
              ← Back to Cost Updater
            </button>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-white transition"
            >
              Sign Out
            </button>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Revenue Updater</h1>
          <p className="text-gray-600">Update conversion revenue for campaigns</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setDateRange(0)}
            className="bg-white p-3 rounded-lg shadow hover:shadow-md transition"
          >
            <p className="text-sm text-gray-600">Today</p>
          </button>
          <button
            type="button"
            onClick={() => setDateRange(7)}
            className="bg-white p-3 rounded-lg shadow hover:shadow-md transition"
          >
            <p className="text-sm text-gray-600">Last 7 Days</p>
          </button>
          <button
            type="button"
            onClick={() => setDateRange(30)}
            className="bg-white p-3 rounded-lg shadow hover:shadow-md transition"
          >
            <p className="text-sm text-gray-600">Last 30 Days</p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-5">
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Campaign * {campaignsLoading ? (
                <span className="text-blue-600 font-normal">(Loading campaigns...)</span>
              ) : (
                <span className="text-gray-500 font-normal">({campaigns.length} total)</span>
              )}
            </label>
            
            {selectedCampaign && !showDropdown ? (
              <div
                onClick={handleCampaignInputClick}
                className={`${inputClass} flex justify-between items-center cursor-pointer hover:border-blue-400`}
              >
                <span>{selectedCampaignName}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCampaign('');
                    setSelectedCampaignName('');
                    setShowDropdown(true);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={campaignSearch}
                onChange={(e) => {
                  setCampaignSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by campaign #, name, or ID..."
                className={inputClass}
                disabled={campaignsLoading}
                autoComplete="off"
              />
            )}

            <input
              type="hidden"
              value={selectedCampaign}
              required
            />

            {showDropdown && !campaignsLoading && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCampaigns.length === 0 ? (
                  <div className="p-3 text-gray-500 text-center">No campaigns found</div>
                ) : (
                  filteredCampaigns.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleCampaignSelect(c)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-medium text-blue-600">#{c.serial_number}</span>
                      <span className="text-gray-700"> - {c.name}</span>
                    </div>
                  ))
                )}
                {filteredCampaigns.length === 50 && (
                  <div className="p-2 text-xs text-center text-gray-500 bg-gray-50">
                    Showing first 50 results. Type to narrow down...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Start Date *
              </label>
              <div 
                className={`${inputClass} cursor-pointer flex items-center justify-between`}
                onClick={() => {
                  const input = document.getElementById('start-date-revenue') as HTMLInputElement;
                  input?.showPicker?.();
                }}
              >
                <span className="text-gray-900">{startDate || 'Select date'}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  id="start-date-revenue"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                End Date *
              </label>
              <div 
                className={`${inputClass} cursor-pointer flex items-center justify-between`}
                onClick={() => {
                  const input = document.getElementById('end-date-revenue') as HTMLInputElement;
                  input?.showPicker?.();
                }}
              >
                <span className="text-gray-900">{endDate || 'Select date'}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  id="end-date-revenue"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchClicks}
            disabled={!selectedCampaign || !startDate || !endDate || clicksLoading}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 font-semibold transition"
          >
            {clicksLoading ? 'Loading Clicks...' : `Load Clicks (${clicks.length} loaded)`}
          </button>

          {clicks.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Click ID *
                </label>
                <select
                  value={selectedClickId}
                  onChange={(e) => setSelectedClickId(e.target.value)}
                  className={inputClass}
                  required
                >
                  {clicks.map((click) => (
                    <option key={click.clickid} value={click.clickid}>
                      {click.clickid.substring(0, 20)}... ({new Date(click.created_at).toLocaleString()})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {clicks.length} clicks available
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Payout (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-600 text-lg font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={payout}
                    onChange={(e) => setPayout(e.target.value)}
                    className={`${inputClass} pl-8`}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Conversion Type *
                </label>
                <input
                  type="text"
                  value={conversionType}
                  onChange={(e) => setConversionType(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. sale, lead, signup"
                  required
                />
              </div>
            </>
          )}

          {message && (
            <div
              className={`p-4 rounded-lg font-medium ${
                message.startsWith('✓')
                  ? 'bg-green-50 text-green-700 border-2 border-green-200'
                  : 'bg-red-50 text-red-700 border-2 border-red-200'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedClickId}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-lg transition shadow-lg hover:shadow-xl"
          >
            {loading ? 'Updating...' : 'Update Revenue'}
          </button>
        </form>
      </div>
    </div>
  );
}