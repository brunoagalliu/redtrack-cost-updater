'use client';

interface CostUpdate {
  id: string;
  campaign: string;
  date: string;
  cost: number;
  status: string;
}

export default function CostHistory() {
  const history: CostUpdate[] = [
    { id: '1', campaign: 'Campaign 1', date: '2026-01-05', cost: 150.00, status: 'success' },
    { id: '2', campaign: 'Campaign 2', date: '2026-01-04', cost: 200.50, status: 'success' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">Recent Updates</h2>
      <div className="space-y-2">
        {history.length === 0 ? (
          <p className="text-gray-500">No recent updates</p>
        ) : (
          history.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{item.campaign}</p>
                <p className="text-sm text-gray-600">{item.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">${item.cost.toFixed(2)}</p>
                <span className="text-xs text-green-600">✓ {item.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}