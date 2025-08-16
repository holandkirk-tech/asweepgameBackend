import React, { useState, useEffect } from 'react';
import { adminAPI } from '../lib/api.js';

/**
 * Enhanced Admin Dashboard Component
 * 
 * Features:
 * - Generate new 5-digit codes
 * - View all generated codes and their status
 * - See spin results with prizes and outcomes
 * - Real-time statistics and analytics
 * - Prize distribution analysis
 * - Pagination for large datasets
 */
export default function AdminDashboard() {
  // State management
  const [spinResults, setSpinResults] = useState([]);
  const [statistics, setStatistics] = useState({
    totalSpins: 0,
    totalWins: 0,
    totalPrizeAmount: 0,
    averagePrize: 0,
    winRate: 0
  });
  const [analytics, setAnalytics] = useState({
    prizeDistribution: [],
    dailyStats: [],
    codeStats: {}
  });
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeTab, setActiveTab] = useState('overview'); // overview, results, analytics
  
  const RECORDS_PER_PAGE = 20;

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load spin results with pagination
      const resultsData = await adminAPI.getSpinResults(RECORDS_PER_PAGE, currentPage * RECORDS_PER_PAGE);
      setSpinResults(resultsData.results);
      setStatistics(resultsData.statistics);
      setTotalRecords(resultsData.total);
      
      // Load analytics data
      const analyticsData = await adminAPI.getAnalytics();
      setAnalytics(analyticsData);
      
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      setIsGenerating(true);
      setError('');
      
      const response = await adminAPI.generateCode();
      if (response.success) {
        setGeneratedCode(response.code);
        // Refresh data to show the new code
        await loadData();
      } else {
        setError('Failed to generate code');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate code');
      console.error('Failed to generate code:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount === 0 ? 'No Prize' : `$${amount}`;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (isUsed, expiresAt, spinTime) => {
    if (spinTime) {
      return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Used</span>;
    }
    if (isUsed) {
      return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Used</span>;
    }
    if (new Date(expiresAt) < new Date()) {
      return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">Expired</span>;
    }
    return <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">Active</span>;
  };

  const getOutcomeBadge = (outcome, prize) => {
    if (!outcome) return null;
    
    if (outcome === 'win') {
      return (
        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
          🎉 Won {formatCurrency(prize)}
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">
          😔 No Prize
        </span>
      );
    }
  };

  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🎰 AceSweeps Admin Dashboard</h1>
          <p className="text-gray-400">Manage codes, view results, and analyze performance</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'results', label: 'Spin Results', icon: '🎯' },
              { id: 'analytics', label: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-400">Total Spins</h3>
                <p className="text-2xl font-bold text-white">{statistics.totalSpins}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-400">Total Wins</h3>
                <p className="text-2xl font-bold text-green-400">{statistics.totalWins}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-400">Total Prizes</h3>
                <p className="text-2xl font-bold text-yellow-400">{formatCurrency(statistics.totalPrizeAmount)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-400">Win Rate</h3>
                <p className="text-2xl font-bold text-blue-400">{statistics.winRate}%</p>
              </div>
            </div>

            {/* Code Generation */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Generate New Code</h2>
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={generateCode}
                  disabled={isGenerating}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Generate 5-Digit Code'}
                </button>
                {generatedCode && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Generated Code:</span>
                    <span className="font-mono text-2xl font-bold text-green-400 bg-gray-700 px-3 py-1 rounded">
                      {generatedCode}
                    </span>
                    <span className="text-sm text-gray-400">(Valid for 3 hours)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Code Statistics */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Code Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400">Total Codes</p>
                  <p className="text-xl font-bold">{analytics.codeStats.total_codes || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400">Used Codes</p>
                  <p className="text-xl font-bold text-green-400">{analytics.codeStats.used_codes || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400">Expired Codes</p>
                  <p className="text-xl font-bold text-red-400">{analytics.codeStats.expired_codes || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold">All Codes & Spin Results</h2>
                <p className="text-gray-400">View all generated codes and their outcomes</p>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-400">Loading results...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Code</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Generated</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Expires</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Spin Result</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Spin Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {spinResults.map((result, index) => (
                          <tr key={`${result.code}-${index}`} className="hover:bg-gray-700/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono text-lg font-bold">{result.code}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {formatDateTime(result.code_created)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {formatDateTime(result.expires_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(result.is_used, result.expires_at, result.spin_time)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getOutcomeBadge(result.outcome, result.prize)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {result.spin_time ? formatDateTime(result.spin_time) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="p-6 border-t border-gray-700 flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        Showing {currentPage * RECORDS_PER_PAGE + 1} to {Math.min((currentPage + 1) * RECORDS_PER_PAGE, totalRecords)} of {totalRecords} results
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                          disabled={currentPage === 0}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded text-sm"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-400">
                          Page {currentPage + 1} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                          disabled={currentPage >= totalPages - 1}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded text-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Prize Distribution */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Prize Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.prizeDistribution.map((item) => (
                  <div key={item.prize} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{formatCurrency(item.prize)}</span>
                      <span className="text-sm text-gray-400">{item.count} times</span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, parseFloat(item.percentage))}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{parseFloat(item.percentage).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Stats */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Daily Statistics (Last 30 Days)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Spins</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Wins</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Total Prizes</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {analytics.dailyStats.map((day) => (
                      <tr key={day.date} className="hover:bg-gray-700/50">
                        <td className="px-4 py-2 text-sm">{formatDate(day.date)}</td>
                        <td className="px-4 py-2 text-sm">{day.spins}</td>
                        <td className="px-4 py-2 text-sm text-green-400">{day.wins}</td>
                        <td className="px-4 py-2 text-sm text-yellow-400">{formatCurrency(day.total_prizes)}</td>
                        <td className="px-4 py-2 text-sm text-blue-400">
                          {day.spins > 0 ? ((day.wins / day.spins) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
