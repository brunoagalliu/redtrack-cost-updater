'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CostHistory from './components/CostHistory';

interface Campaign {
  id: string;
  serial_number: number;
  name: string;
}

interface SubOption {
  value: string;
  label: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [subOptions, setSubOptions] = useState<SubOption[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedCampaignName, setSelectedCampaignName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cost, setCost] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [subName, setSubName] = useState('');
  const [subValue, setSubValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [subsLoading, setSubsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [shouldFetchSubs, setShouldFetchSubs] = useState(false);

  // Redirect to login if not authenticated
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
    if (selectedCampaign && shouldFetchSubs) {
      fetchSubOptionsForCampaign(selectedCampaign);
      setShouldFetchSubs(false);
    } else if (!selectedCampaign) {
      setSubOptions([]);
      setSubName('');
      setSubValue('');
    }
  }, [selectedCampaign, shouldFetchSubs]);

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

  const fetchSubOptionsForCampaign = async (campaignId: string) => {
    setSubsLoading(true);
    try {
      const response = await fetch(`/api/subs/${campaignId}`);
      const data = await response.json();
      setSubOptions(data.subs || []);
      
      if (data.subs && data.subs.length === 0) {
        console.log('No subs found for this campaign');
      }
    } catch (error) {
      console.error('Failed to fetch sub options:', error);
      setSubOptions([]);
    } finally {
      setSubsLoading(false);
    }
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign.id);
    setSelectedCampaignName(`#${campaign.serial_number} - ${campaign.name}`);
    setCampaignSearch('');
    setShowDropdown(false);
    setSubName('');
    setSubValue('');
    setShouldFetchSubs(true);
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
      const response = await fetch('/api/update-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: selectedCampaign,
          time_from: startDate,
          time_to: endDate,
          cost: parseFloat(cost),
          country_code: countryCode || undefined,
          sub_name: subName || undefined,
          sub_value: subValue || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ Cost updated successfully!');
        setCost('');
        setCountryCode('');
        setSubName('');
        setSubValue('');
      } else {
        setMessage(`✗ Error: ${data.error || 'Failed to update cost'}`);
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

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Only render the page if authenticated
  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-white transition"
            >
              Sign Out
            </button>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Redtrack Cost Updater</h1>
          <p className="text-gray-600">Update campaign costs quickly and easily</p>
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
                  const input = document.getElementById('start-date') as HTMLInputElement;
                  input?.showPicker?.();
                }}
              >
                <span className="text-gray-900">{startDate || 'Select date'}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  id="start-date"
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
                  const input = document.getElementById('end-date') as HTMLInputElement;
                  input?.showPicker?.();
                }}
              >
                <span className="text-gray-900">{endDate || 'Select date'}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Cost (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-600 text-lg font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className={`${inputClass} pl-8`}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="border-t pt-5">
            <p className="text-sm font-semibold mb-3 text-gray-700">Optional Filters</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-600">Country Code</label>
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                  className={inputClass}
                  placeholder="e.g. US, GB, DE"
                  maxLength={2}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-600">
                    Sub Name {subsLoading && <span className="text-xs text-blue-600">(Loading...)</span>}
                  </label>
                  <select
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className={inputClass}
                    disabled={!selectedCampaign || subsLoading}
                  >
                    <option value="">
                      {!selectedCampaign ? 'Select campaign first' : subsLoading ? 'Loading subs...' : subOptions.length === 0 ? 'No subs available' : 'Select sub name'}
                    </option>
                    {subOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-600">Sub Value</label>
                  <input
                    type="text"
                    value={subValue}
                    onChange={(e) => setSubValue(e.target.value)}
                    className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-500`}
                    placeholder="e.g. 12345"
                    disabled={!subName}
                  />
                </div>
              </div>
            </div>
          </div>

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
            disabled={loading || campaignsLoading}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-lg transition shadow-lg hover:shadow-xl"
          >
            {loading ? 'Updating...' : 'Update Cost'}
          </button>
        </form>

        <CostHistory />
      </div>
    </div>
  );
}