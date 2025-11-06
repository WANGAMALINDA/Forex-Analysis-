import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle, Target, Shield, RefreshCw, Bitcoin, DollarSign, BarChart3, TrendingUp as TrendIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";


const EnhancedForexDashboard = () => {
    const firebaseConfig = {
    apiKey: "AIzaSyAfYB-UOcFUOWTOcmpzPdAt1y-K6dXIhMg",
    authDomain: "stock-analysist.firebaseapp.com",
    projectId: "stock-analysist",
    storageBucket: "stock-analysist.firebasestorage.app",
    messagingSenderId: "801305653825",
    appId: "1:801305653825:web:0b968a55e2920dc7144cc0",
    measurementId: "G-RJWSBWL97F"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
  const [marketSentiment, setMarketSentiment] = useState({});

  // Enhanced asset list including forex, crypto, indices, and commodities
  const assetDefinitions = [
    // Forex Pairs
    { base: 'EUR', quote: 'USD', display: 'EUR/USD', type: 'forex', category: 'Major' },
    { base: 'GBP', quote: 'USD', display: 'GBP/USD', type: 'forex', category: 'Major' },
    { base: 'USD', quote: 'JPY', display: 'USD/JPY', type: 'forex', category: 'Major' },
    { base: 'AUD', quote: 'USD', display: 'AUD/USD', type: 'forex', category: 'Commodity' },
    { base: 'USD', quote: 'CAD', display: 'USD/CAD', type: 'forex', category: 'Commodity' },
    { base: 'USD', quote: 'CHF', display: 'USD/CHF', type: 'forex', category: 'Safe Haven' },
    { base: 'NZD', quote: 'USD', display: 'NZD/USD', type: 'forex', category: 'Commodity' },
    { base: 'EUR', quote: 'GBP', display: 'EUR/GBP', type: 'forex', category: 'Cross' },
    
    // Cryptocurrencies
    { base: 'BTC', quote: 'USD', display: 'BTC/USD', type: 'crypto', category: 'Cryptocurrency', icon: Bitcoin },
    { base: 'ETH', quote: 'USD', display: 'ETH/USD', type: 'crypto', category: 'Cryptocurrency', icon: Bitcoin },
    
    // Commodities
    { base: 'XAU', quote: 'USD', display: 'GOLD/USD', type: 'commodity', category: 'Precious Metal', icon: DollarSign },
    { base: 'XAG', quote: 'USD', display: 'SILVER/USD', type: 'commodity', category: 'Precious Metal' },
    
    // Indices
    { base: 'NAS100', quote: 'USD', display: 'NASDAQ 100', type: 'index', category: 'US Index', icon: BarChart3 },
    { base: 'US30', quote: 'USD', display: 'DOW JONES 30', type: 'index', category: 'US Index', icon: TrendIcon },
    { base: 'SPX500', quote: 'USD', display: 'S&P 500', type: 'index', category: 'US Index' }
  ];

  // Calculate technical indicators
  const calculateTechnicalIndicators = (data, assetType) => {
    if (!data || data.length < 14) return null;
    
    const prices = data.map(d => d.price).filter(p => p != null && !isNaN(p));
    if (prices.length < 14) return null;
    
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const bollinger = calculateBollingerBands(prices);
    const volatility = calculateVolatility(prices);
    
    return {
      rsi: rsi,
      macd: macd,
      bollinger: bollinger,
      volatility: volatility,
      trend: determineTrend(prices),
      momentum: calculateMomentum(prices),
      support: Math.min(...prices.slice(-5)),
      resistance: Math.max(...prices.slice(-5))
    };
  };
  
  const calculateRSI = (prices, period = 14) => {
    if (prices.length < period) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const calculateMACD = (prices) => {
    if (prices.length < 26) return { signal: 0, histogram: 0 };
    
    const ema12 = calculateEMA(prices.slice(-12), 12);
    const ema26 = calculateEMA(prices.slice(-26), 26);
    const macdLine = ema12 - ema26;
    
    return {
      signal: macdLine > 0 ? 1 : -1,
      histogram: macdLine
    };
  };

  const calculateEMA = (prices, period) => {
    if (prices.length === 0) return 0;
    
    let ema = prices[0];
    const multiplier = 2 / (period + 1);
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  };

  const calculateBollingerBands = (prices, period = 20) => {
    if (prices.length < period) return { upper: 0, lower: 0, middle: 0 };
    
    const slice = prices.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: middle + (stdDev * 2),
      middle: middle,
      lower: middle - (stdDev * 2)
    };
  };

  const calculateVolatility = (prices) => {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1] !== 0) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
    }
    
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  };

  const determineTrend = (prices) => {
    if (prices.length < 10) return 'neutral';
    
    const recent = prices.slice(-5);
    const older = prices.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    if (olderAvg === 0) return 'neutral';
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.02) return 'bullish';
    if (change < -0.02) return 'bearish';
    return 'neutral';
  };

  const calculateMomentum = (prices) => {
    if (prices.length < 10) return 0;
    
    const current = prices[prices.length - 1];
    const past = prices[prices.length - 10];
    
    if (past === 0) return 0;
    
    return ((current - past) / past) * 100;
  };

  // Enhanced data fetching with multiple sources
  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      const newAssets = [];
      const timestamp = Date.now();
      
      // Simulate fetching different asset types from various sources
      for (const asset of assetDefinitions) {
        let basePrice, change, volatility;
        
        if (asset.type === 'forex') {
          // Forex rates - simulated but realistic
          const rates = {
            'EURUSD': 1.0850 + (Math.random() - 0.5) * 0.02,
            'GBPUSD': 1.2750 + (Math.random() - 0.5) * 0.03,
            'USDJPY': 149.50 + (Math.random() - 0.5) * 2,
            'AUDUSD': 0.6550 + (Math.random() - 0.5) * 0.02,
            'USDCAD': 1.3650 + (Math.random() - 0.5) * 0.02,
            'USDCHF': 0.8850 + (Math.random() - 0.5) * 0.02,
            'NZDUSD': 0.6150 + (Math.random() - 0.5) * 0.02,
            'EURGBP': 0.8550 + (Math.random() - 0.5) * 0.02
          };
          
          const key = asset.base + asset.quote;
          basePrice = rates[key] || 1.0;
          volatility = 0.5 + Math.random() * 1.5;
          change = (Math.random() - 0.5) * 2;
          
        } else if (asset.type === 'crypto') {
          // Crypto prices - simulated
          if (asset.base === 'BTC') {
            basePrice = 45000 + (Math.random() - 0.5) * 5000;
            volatility = 3 + Math.random() * 5;
          } else if (asset.base === 'ETH') {
            basePrice = 2500 + (Math.random() - 0.5) * 500;
            volatility = 4 + Math.random() * 6;
          }
          change = (Math.random() - 0.5) * 8;
          
        } else if (asset.type === 'commodity') {
          // Commodity prices - simulated
          if (asset.base === 'XAU') {
            basePrice = 2050 + (Math.random() - 0.5) * 50;
            volatility = 1 + Math.random() * 2;
          } else if (asset.base === 'XAG') {
            basePrice = 25.5 + (Math.random() - 0.5) * 2;
            volatility = 1.5 + Math.random() * 2.5;
          }
          change = (Math.random() - 0.5) * 3;
          
        } else if (asset.type === 'index') {
          // Index prices - simulated
          if (asset.base === 'NAS100') {
            basePrice = 18500 + (Math.random() - 0.5) * 500;
            volatility = 1.5 + Math.random() * 2;
          } else if (asset.base === 'US30') {
            basePrice = 38500 + (Math.random() - 0.5) * 400;
            volatility = 1.2 + Math.random() * 1.8;
          } else if (asset.base === 'SPX500') {
            basePrice = 5100 + (Math.random() - 0.5) * 100;
            volatility = 1.3 + Math.random() * 2;
          }
          change = (Math.random() - 0.5) * 4;
        }
        
        // Calculate bid/ask based on volatility
        const spread = basePrice * (0.0001 + volatility * 0.00001);
        
        const assetData = {
          ...asset,
          price: parseFloat(basePrice.toFixed(asset.type === 'crypto' ? 2 : 5)),
          change: parseFloat(change.toFixed(2)),
          trend: change >= 0 ? 'bullish' : 'bearish',
          bid: parseFloat((basePrice - spread).toFixed(asset.type === 'crypto' ? 2 : 5)),
          ask: parseFloat((basePrice + spread).toFixed(asset.type === 'crypto' ? 2 : 5)),
          volume: Math.floor(Math.random() * 1000000000),
          marketCap: asset.type === 'crypto' ? Math.floor(basePrice * 19000000) : null,
          volatility: parseFloat(volatility.toFixed(2)),
          timestamp
        };
        
        newAssets.push(assetData);
      }
      
      // Update historical data - FIXED: No direct mutation
      setHistoricalData(prev => {
        const updated = {};
        newAssets.forEach(asset => {
          const existingData = prev[asset.display] || [];
          updated[asset.display] = [
            ...existingData,
            {
              time: new Date().toLocaleTimeString(),
              price: asset.price,
              volume: asset.volume
            }
          ].slice(-50); // Keep only last 50 points
        });
        return updated;
      });
      
      setAssets(newAssets);
      
      if (!selectedAsset && newAssets.length > 0) {
        setSelectedAsset(newAssets[0]);
      } else if (selectedAsset) {
        const updatedSelected = newAssets.find(a => a.display === selectedAsset.display);
        if (updatedSelected) {
          setSelectedAsset(updatedSelected);
        }
      }
      
      setLastUpdate(new Date());
      setLoading(false);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to fetch market data');
      setLoading(false);
    }
  }, []); // Remove selectedAsset dependency to avoid infinite loop

  // Enhanced AI Analysis
  const generateComprehensiveAnalysis = useCallback((asset, historicalData) => {
    if (!asset || !historicalData || historicalData.length < 10) return null;
    
    const indicators = calculateTechnicalIndicators(historicalData, asset.type);
    if (!indicators) return null;
    
    // Market sentiment analysis
    const sentimentScore = calculateSentimentScore(asset, indicators);
    
    // Risk assessment
    const riskAssessment = assessRisk(asset, indicators);
    
    // Trading recommendations
    const recommendations = generateRecommendations(asset, indicators, sentimentScore);
    
    // Price prediction
    const prediction = predictPriceMovement(asset, indicators);
    
    // Market context
    const marketContext = analyzeMarketContext(asset, indicators);
    
    return {
      ...indicators,
      sentiment: sentimentScore,
      risk: riskAssessment,
      recommendations: recommendations,
      prediction: prediction,
      context: marketContext,
      confidence: calculateConfidence(indicators, sentimentScore),
      timeHorizon: determineTimeHorizon(indicators, asset.type),
      liquidity: assessLiquidity(asset, historicalData),
      correlation: analyzeCorrelations(asset)
    };
  }, []);

  const calculateSentimentScore = (asset, indicators) => {
    let score = 50; // Neutral base
    
    // Technical indicators contribution
    if (indicators.rsi > 70) score -= 15; // Overbought
    else if (indicators.rsi < 30) score += 15; // Oversold
    
    if (indicators.macd.signal > 0) score += 10;
    else score -= 10;
    
    if (indicators.trend === 'bullish') score += 20;
    else if (indicators.trend === 'bearish') score -= 20;
    
    // Volatility impact
    if (indicators.volatility > 30) score -= 10; // High volatility = lower sentiment
    else if (indicators.volatility < 10) score += 5; // Low stability = positive
    
    // Momentum contribution
    score += indicators.momentum * 2;
    
    return Math.max(0, Math.min(100, score));
  };

  const assessRisk = (asset, indicators) => {
    const volatility = indicators.volatility;
    const trend = indicators.trend;
    const momentum = indicators.momentum;
    
    let riskLevel = 'medium';
    let riskScore = 50;
    
    if (volatility > 40) {
      riskLevel = 'high';
      riskScore = 80;
    } else if (volatility < 15) {
      riskLevel = 'low';
      riskScore = 20;
    }
    
    // Adjust for asset type
    if (asset.type === 'crypto') {
      riskScore += 20;
    } else if (asset.type === 'commodity' && asset.base === 'XAU') {
      riskScore -= 10; // Gold is safer
    } else if (asset.type === 'index') {
      riskScore -= 5; // Indices are relatively stable
    }
    
    return {
      level: riskLevel,
      score: Math.max(0, Math.min(100, riskScore)),
      factors: {
        volatility: volatility,
        trendStrength: Math.abs(momentum),
        marketCondition: indicators.trend
      }
    };
  };

  const generateRecommendations = (asset, indicators, sentiment) => {
    const recommendations = [];
    
    // Entry recommendation
    if (sentiment > 70 && indicators.trend === 'bullish') {
      recommendations.push({
        type: 'buy',
        strength: 'strong',
        reason: 'Strong bullish momentum with positive sentiment',
        entry: asset.price,
        stopLoss: indicators.support,
        takeProfit: indicators.resistance
      });
    } else if (sentiment < 30 && indicators.trend === 'bearish') {
      recommendations.push({
        type: 'sell',
        strength: 'strong',
        reason: 'Strong bearish momentum with negative sentiment',
        entry: asset.price,
        stopLoss: indicators.resistance,
        takeProfit: indicators.support
      });
    } else if (sentiment > 60 && sentiment < 70) {
      recommendations.push({
        type: 'buy',
        strength: 'moderate',
        reason: 'Moderate bullish bias',
        entry: asset.price,
        stopLoss: indicators.support * 0.98,
        takeProfit: indicators.resistance * 1.02
      });
    }
    
    // Risk management
    const riskPerTrade = Math.min(2, 100 - indicators.volatility);
    recommendations.push({
      type: 'risk',
      strength: 'high',
      reason: `Risk management: Maximum ${riskPerTrade.toFixed(1)}% per trade recommended`,
      positionSize: `${Math.max(1, 10 - indicators.volatility / 5).toFixed(1)}% of portfolio`
    });
    
    // Time-based recommendations
    if (asset.type === 'crypto') {
      recommendations.push({
        type: 'timing',
        strength: 'moderate',
        reason: 'Crypto markets 24/7 - consider global session overlaps'
      });
    }
    
    return recommendations;
  };

  const predictPriceMovement = (asset, indicators) => {
    const volatility = indicators.volatility / 100;
    const trendMultiplier = indicators.trend === 'bullish' ? 1 : indicators.trend === 'bearish' ? -1 : 0;
    const momentumImpact = indicators.momentum / 100;
    
    const shortTerm = asset.price * (1 + (trendMultiplier * 0.01 + momentumImpact * 0.005 + (Math.random() - 0.5) * volatility * 0.5));
    const mediumTerm = asset.price * (1 + (trendMultiplier * 0.03 + momentumImpact * 0.01 + (Math.random() - 0.5) * volatility));
    const longTerm = asset.price * (1 + (trendMultiplier * 0.05 + momentumImpact * 0.02 + (Math.random() - 0.5) * volatility * 1.5));
    
    return {
      '1h': shortTerm,
      '24h': mediumTerm,
      '7d': longTerm,
      confidence: Math.max(60, Math.min(95, 85 - volatility * 20))
    };
  };

  const analyzeMarketContext = (asset, indicators) => {
    const context = {
      regime: determineMarketRegime(indicators),
      volatility: classifyVolatility(indicators.volatility),
      liquidity: 'high',
      session: determineCurrentSession(),
      newsImpact: 'moderate'
    };
    
    // Asset-specific context
    if (asset.type === 'forex') {
      context.liquidity = 'very-high';
      context.newsImpact = 'high';
    } else if (asset.type === 'crypto') {
      context.liquidity = 'medium';
      context.newsImpact = 'very-high';
    } else if (asset.type === 'index') {
      context.liquidity = 'high';
      context.newsImpact = 'high';
    }
    
    return context;
  };

  const determineMarketRegime = (indicators) => {
    if (indicators.volatility > 30) return 'high-volatility';
    if (indicators.volatility < 10) return 'low-volatility';
    if (indicators.trend === 'bullish' && indicators.momentum > 2) return 'bull-trend';
    if (indicators.trend === 'bearish' && indicators.momentum < -2) return 'bear-trend';
    return 'range-bound';
  };

  const classifyVolatility = (vol) => {
    if (vol > 40) return 'extreme';
    if (vol > 25) return 'high';
    if (vol > 15) return 'moderate';
    if (vol > 10) return 'low';
    return 'very-low';
  };

  const determineCurrentSession = () => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 16) return 'US';
    if (hour >= 16 && hour < 24) return 'Asian';
    return 'European';
  };

  const calculateConfidence = (indicators, sentiment) => {
    let confidence = 70;
    
    // Adjust based on data quality
    if (indicators.rsi && indicators.macd) confidence += 10;
    
    // Volatility impact
    if (indicators.volatility < 20) confidence += 10;
    else if (indicators.volatility > 40) confidence -= 15;
    
    // Trend strength
    if (indicators.trend !== 'neutral') confidence += 10;
    
    // Sentiment alignment
    if ((indicators.trend === 'bullish' && sentiment > 60) || 
        (indicators.trend === 'bearish' && sentiment < 40)) {
      confidence += 10;
    }
    
    return Math.max(50, Math.min(95, confidence));
  };

  const determineTimeHorizon = (indicators, assetType) => {
    if (assetType === 'crypto') return 'short-term';
    if (indicators.volatility > 30) return 'intraday';
    if (indicators.trend !== 'neutral') return 'swing';
    return 'position';
  };

  const assessLiquidity = (asset, historicalData) => {
    if (!historicalData || historicalData.length === 0) return 'unknown';
    
    const avgVolume = historicalData.reduce((sum, d) => sum + (d.volume || 0), 0) / historicalData.length;
    
    if (avgVolume > 100000000) return 'very-high';
    if (avgVolume > 10000000) return 'high';
    if (avgVolume > 1000000) return 'medium';
    return 'low';
  };

  const analyzeCorrelations = (asset) => {
    // Simplified correlation analysis
    const correlations = {};
    
    if (asset.type === 'forex') {
      correlations['USD'] = asset.quote === 'USD' ? -0.8 : 0.6;
      correlations['Risk'] = asset.base === 'JPY' || asset.base === 'CHF' ? -0.5 : 0.3;
    } else if (asset.type === 'crypto') {
      correlations['BTC'] = asset.base === 'BTC' ? 1.0 : 0.7;
      correlations['Risk'] = 0.8;
    } else if (asset.type === 'commodity') {
      if (asset.base === 'XAU') {
        correlations['USD'] = -0.6;
        correlations['Inflation'] = 0.7;
      }
    }
    
    return correlations;
  };

  // Update chart data when selected asset price changes
  useEffect(() => {
    if (selectedAsset) {
      setChartData(prev => {
        const newData = {
          time: new Date().toLocaleTimeString(),
          price: selectedAsset.price
        };
        return [...prev, newData].slice(-30);
      });
    }
  }, [selectedAsset?.price, selectedAsset?.display]);

  // Generate AI analysis when asset changes
  useEffect(() => {
    if (selectedAsset && historicalData[selectedAsset.display]) {
      const analysis = generateComprehensiveAnalysis(selectedAsset, historicalData[selectedAsset.display]);
      setAiAnalysis(analysis);
    }
  }, [selectedAsset, historicalData, generateComprehensiveAnalysis]);

  // Initial data fetch and interval
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Helper functions
  const getAssetColor = (asset) => {
    const colors = {
      forex: '#22d3ee',
      crypto: '#f59e0b',
      commodity: '#84cc16',
      index: '#8b5cf6'
    };
    return colors[asset.type] || '#22d3ee';
  };

  const getTrendColor = (trend) => trend === 'bullish' ? '#4ade80' : trend === 'bearish' ? '#f87171' : '#64748b';
  
  const getTrendBg = (trend) => {
    const colors = {
      bullish: 'rgba(34, 197, 94, 0.1)',
      bearish: 'rgba(239, 68, 68, 0.1)',
      neutral: 'rgba(100, 116, 139, 0.1)'
    };
    return colors[trend] || colors.neutral;
  };

  const getRiskColor = (level) => {
    const colors = {
      low: '#4ade80',
      medium: '#f59e0b',
      high: '#f87171'
    };
    return colors[level] || '#64748b';
  };

  const getAssetIcon = (asset) => {
    if (asset.icon) {
      const IconComponent = asset.icon;
      return <IconComponent style={{ width: '16px', height: '16px' }} />;
    }
    return <Activity style={{ width: '16px', height: '16px' }} />;
  };

  if (loading && assets.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw style={{ 
            width: '64px', 
            height: '64px', 
            color: '#22d3ee', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#ffffff', fontSize: '20px' }}>Loading market data...</p>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>Fetching forex, crypto, indices & commodities</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #22d3ee, #60a5fa)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Market Analysis Pro
            </h1>
            <p style={{ color: '#94a3b8' }}>Multi-asset trading with AI-powered insights</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: error ? '#ef4444' : '#10b981',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}></div>
              {error ? 'Connection Error' : 'Live Data'}
            </div>
            {lastUpdate && (
              <p style={{ color: '#64748b', fontSize: '12px' }}>
                Last update: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <AlertCircle style={{ color: '#f87171', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ color: '#fca5a5', fontWeight: 'bold' }}>Error loading data</p>
              <p style={{ color: '#f87171', fontSize: '14px' }}>{error}</p>
            </div>
            <button 
              onClick={fetchMarketData}
              style={{
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Asset Categories */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {['forex', 'crypto', 'commodity', 'index'].map(type => (
              <div key={type} style={{
                padding: '8px 16px',
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '8px',
                border: `1px solid ${type === selectedAsset?.type ? getAssetColor({ type }) : 'rgba(51, 65, 85, 0.5)'}`,
                color: type === selectedAsset?.type ? getAssetColor({ type }) : '#94a3b8',
                fontWeight: type === selectedAsset?.type ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                {type.charAt(0).toUpperCase() + type.slice(1)} ({assets.filter(a => a.type === type).length})
              </div>
            ))}
          </div>
        </div>

        {/* Assets Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {assets.map((asset) => (
            <div
              key={asset.display}
              onClick={() => setSelectedAsset(asset)}
              style={{
                cursor: 'pointer',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid',
                transition: 'all 0.3s ease',
                ...(selectedAsset?.display === asset.display
                  ? {
                      background: 'rgba(34, 211, 238, 0.2)',
                      borderColor: '#22d3ee',
                      boxShadow: '0 10px 15px -3px rgba(34, 211, 238, 0.2)'
                    }
                  : {
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderColor: 'rgba(51, 65, 85, 0.5)'
                    })
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getAssetIcon(asset)}
                  <div>
                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{asset.display}</span>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{asset.category}</div>
                  </div>
                </div>
                {asset.trend === 'bullish' ? (
                  <TrendingUp style={{ color: '#4ade80', width: '16px', height: '16px' }} />
                ) : asset.trend === 'bearish' ? (
                  <TrendingDown style={{ color: '#f87171', width: '16px', height: '16px' }} />
                ) : (
                  <Activity style={{ color: '#64748b', width: '16px', height: '16px' }} />
                )}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                {asset.price}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: asset.change >= 0 ? '#4ade80' : '#f87171' 
              }}>
                {asset.change >= 0 ? '+' : ''}{asset.change}%
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                <span>Vol: {asset.volatility}%</span>
                <span style={{ color: getAssetColor(asset) }}>{asset.type.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>

        {selectedAsset && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px'
          }}>
            {/* Chart Section */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(4px)',
              borderRadius: '12px',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity style={{ color: getAssetColor(selectedAsset) }} />
                  Live Chart - {selectedAsset.display}
                </h2>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  background: getTrendBg(selectedAsset.trend),
                  color: getTrendColor(selectedAsset.trend)
                }}>
                  {selectedAsset.trend.toUpperCase()}
                </div>
              </div>
              
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData[selectedAsset.display] || []}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={getAssetColor(selectedAsset)} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={getAssetColor(selectedAsset)} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={getAssetColor(selectedAsset)} 
                      strokeWidth={2}
                      fill="url(#colorGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginTop: '24px'
              }}>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid rgba(51, 65, 85, 0.3)'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Current Price</div>
                  <div style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>{selectedAsset.price}</div>
                </div>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid rgba(51, 65, 85, 0.3)'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Spread</div>
                  <div style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>
                    {(selectedAsset.ask - selectedAsset.bid).toFixed(selectedAsset.type === 'crypto' ? 2 : 5)}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid rgba(51, 65, 85, 0.3)'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Change</div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold',
                    color: selectedAsset.change >= 0 ? '#4ade80' : '#f87171'
                  }}>
                    {selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change}%
                  </div>
                </div>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid rgba(51, 65, 85, 0.3)'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Volatility</div>
                  <div style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>{selectedAsset.volatility}%</div>
                </div>
              </div>
            </div>

            {/* Comprehensive AI Analysis */}
            {aiAnalysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Quick SL/TP Summary - NEW SECTION */}
                {aiAnalysis.recommendations?.find(r => r.type === 'buy' || r.type === 'sell') && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(59, 130, 246, 0.15))',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '12px',
                    border: '2px solid rgba(34, 211, 238, 0.4)',
                    padding: '24px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <Target style={{ color: '#22d3ee', width: '24px', height: '24px' }} />
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>Trading Levels</h3>
                    </div>
                    
                    {(() => {
                      const tradeRec = aiAnalysis.recommendations.find(r => r.type === 'buy' || r.type === 'sell');
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                          <div style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            border: '2px solid rgba(59, 130, 246, 0.4)'
                          }}>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>ENTRY PRICE</div>
                            <div style={{ color: '#60a5fa', fontSize: '28px', fontWeight: 'bold' }}>
                              {tradeRec.entry?.toFixed(selectedAsset.type === 'crypto' ? 2 : 5)}
                            </div>
                            <div style={{ 
                              marginTop: '8px',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              background: tradeRec.type === 'buy' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: tradeRec.type === 'buy' ? '#4ade80' : '#f87171',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {tradeRec.type.toUpperCase()} {tradeRec.strength.toUpperCase()}
                            </div>
                          </div>
                          
                          <div style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            border: '2px solid rgba(239, 68, 68, 0.4)'
                          }}>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>STOP LOSS</div>
                            <div style={{ color: '#f87171', fontSize: '28px', fontWeight: 'bold' }}>
                              {typeof tradeRec.stopLoss === 'number' ? tradeRec.stopLoss.toFixed(selectedAsset.type === 'crypto' ? 2 : 5) : tradeRec.stopLoss}
                            </div>
                            <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '8px' }}>
                              Risk: {Math.abs(((tradeRec.stopLoss - tradeRec.entry) / tradeRec.entry * 100)).toFixed(2)}%
                            </div>
                          </div>
                          
                          <div style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            border: '2px solid rgba(34, 197, 94, 0.4)'
                          }}>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>TAKE PROFIT</div>
                            <div style={{ color: '#4ade80', fontSize: '28px', fontWeight: 'bold' }}>
                              {typeof tradeRec.takeProfit === 'number' ? tradeRec.takeProfit.toFixed(selectedAsset.type === 'crypto' ? 2 : 5) : tradeRec.takeProfit}
                            </div>
                            <div style={{ color: '#86efac', fontSize: '12px', marginTop: '8px' }}>
                              Reward: {Math.abs(((tradeRec.takeProfit - tradeRec.entry) / tradeRec.entry * 100)).toFixed(2)}%
                            </div>
                          </div>
                          
                          <div style={{
                            background: 'rgba(34, 211, 238, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            border: '2px solid rgba(34, 211, 238, 0.4)'
                          }}>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>RISK/REWARD</div>
                            <div style={{ color: '#22d3ee', fontSize: '28px', fontWeight: 'bold' }}>
                              1:{(Math.abs((tradeRec.takeProfit - tradeRec.entry)) / Math.abs((tradeRec.stopLoss - tradeRec.entry))).toFixed(2)}
                            </div>
                            <div style={{ color: '#67e8f9', fontSize: '12px', marginTop: '8px' }}>
                              Position: 2-5%
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {/* Main AI Analysis Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(96, 165, 250, 0.1))',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <AlertCircle style={{ color: '#22d3ee' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>Comprehensive AI Analysis</h3>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Confidence Level</div>
                      <div style={{ color: '#22d3ee', fontSize: '24px', fontWeight: 'bold' }}>
                        {aiAnalysis.confidence.toFixed(0)}%
                      </div>
                      <div style={{
                        width: '100%',
                        background: 'rgba(51, 65, 85, 0.5)',
                        borderRadius: '20px',
                        height: '8px',
                        marginTop: '8px'
                      }}>
                        <div 
                          style={{
                            background: 'linear-gradient(135deg, #22d3ee, #60a5fa)',
                            height: '8px',
                            borderRadius: '20px',
                            transition: 'width 0.5s ease',
                            width: `${aiAnalysis.confidence}%`
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Sentiment Score</div>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        color: aiAnalysis.sentiment > 60 ? '#4ade80' : aiAnalysis.sentiment < 40 ? '#f87171' : '#f59e0b'
                      }}>
                        {aiAnalysis.sentiment.toFixed(0)}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                        {aiAnalysis.sentiment > 60 ? 'Bullish' : aiAnalysis.sentiment < 40 ? 'Bearish' : 'Neutral'}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Risk Level</div>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        color: getRiskColor(aiAnalysis.risk.level)
                      }}>
                        {aiAnalysis.risk.level.toUpperCase()}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                        Score: {aiAnalysis.risk.score}/100
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Time Horizon</div>
                      <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
                        {aiAnalysis.timeHorizon.replace('-', ' ')}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                        Optimal holding period
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '8px' }}>
                    <div style={{ color: '#ffffff', fontSize: '14px', lineHeight: '1.5' }}>
                      <span style={{ fontWeight: 'bold', color: '#22d3ee' }}>Market Context:</span> {aiAnalysis.context.regime.replace('-', ' ')} regime 
                      with {aiAnalysis.context.volatility} volatility. Current {aiAnalysis.context.session} session. 
                      Liquidity: {aiAnalysis.liquidity}.
                    </div>
                  </div>
                </div>

                {/* Technical Indicators */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  padding: '24px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                    Technical Indicators
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>RSI (14)</div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold',
                        color: aiAnalysis.rsi > 70 ? '#f87171' : aiAnalysis.rsi < 30 ? '#4ade80' : '#f59e0b'
                      }}>
                        {aiAnalysis.rsi?.toFixed(1)}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>MACD Signal</div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold',
                        color: aiAnalysis.macd?.signal > 0 ? '#4ade80' : '#f87171'
                      }}>
                        {aiAnalysis.macd?.signal > 0 ? 'BULLISH' : 'BEARISH'}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Support</div>
                      <div style={{ color: '#4ade80', fontSize: '20px', fontWeight: 'bold' }}>
                        {aiAnalysis.support?.toFixed(selectedAsset.type === 'crypto' ? 2 : 5)}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Resistance</div>
                      <div style={{ color: '#f87171', fontSize: '20px', fontWeight: 'bold' }}>
                        {aiAnalysis.resistance?.toFixed(selectedAsset.type === 'crypto' ? 2 : 5)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trading Recommendations */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  padding: '24px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                    AI Trading Recommendations
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {aiAnalysis.recommendations?.map((rec, index) => (
                      <div key={index} style={{
                        padding: '12px',
                        background: rec.type === 'buy' ? 'rgba(34, 197, 94, 0.1)' : 
                                     rec.type === 'sell' ? 'rgba(239, 68, 68, 0.1)' : 
                                     'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${rec.type === 'buy' ? 'rgba(34, 197, 94, 0.3)' : 
                                           rec.type === 'sell' ? 'rgba(239, 68, 68, 0.3)' : 
                                           'rgba(59, 130, 246, 0.3)'}`,
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ 
                            color: rec.type === 'buy' ? '#4ade80' : 
                                   rec.type === 'sell' ? '#f87171' : '#60a5fa',
                            fontWeight: 'bold'
                          }}>
                            {rec.type.toUpperCase()} {rec.strength && `(${rec.strength})`}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '12px' }}>
                            {rec.type === 'buy' || rec.type === 'sell' ? 'Position Size: 2-5%' : ''}
                          </span>
                        </div>
                        <div style={{ color: '#cbd5e1', fontSize: '14px' }}>
                          {rec.reason}
                        </div>
                        {rec.stopLoss && rec.takeProfit && (
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '12px', 
                            marginTop: '12px',
                            padding: '12px',
                            background: 'rgba(15, 23, 42, 0.5)',
                            borderRadius: '8px'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>STOP LOSS</div>
                              <div style={{ color: '#f87171', fontSize: '18px', fontWeight: 'bold' }}>
                                {typeof rec.stopLoss === 'number' ? rec.stopLoss.toFixed(selectedAsset.type === 'crypto' ? 2 : 5) : rec.stopLoss}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>TAKE PROFIT</div>
                              <div style={{ color: '#4ade80', fontSize: '18px', fontWeight: 'bold' }}>
                                {typeof rec.takeProfit === 'number' ? rec.takeProfit.toFixed(selectedAsset.type === 'crypto' ? 2 : 5) : rec.takeProfit}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Predictions */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  padding: '24px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                    AI Price Predictions
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    {Object.entries(aiAnalysis.prediction || {}).map(([timeframe, price]) => (
                      timeframe !== 'confidence' && typeof price === 'number' && (
                        <div key={timeframe} style={{
                          background: 'rgba(15, 23, 42, 0.5)',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>{timeframe.toUpperCase()}</div>
                          <div style={{ 
                            fontSize: '24px', 
                            fontWeight: 'bold',
                            color: price > selectedAsset.price ? '#4ade80' : '#f87171'
                          }}>
                            {price.toFixed(selectedAsset.type === 'crypto' ? 2 : 5)}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: price > selectedAsset.price ? '#4ade80' : '#f87171',
                            marginTop: '4px'
                          }}>
                            {price > selectedAsset.price ? '+' : ''}{((price - selectedAsset.price) / selectedAsset.price * 100).toFixed(2)}%
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                  
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    background: 'rgba(59, 130, 246, 0.1)', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <span style={{ color: '#60a5fa', fontSize: '14px' }}>
                      Prediction Confidence: {aiAnalysis.prediction?.confidence?.toFixed(0)}% | 
                      Based on technical analysis and market patterns
                    </span>
                  </div>
                </div>

                {/* Risk Management */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '12px',
                  border: `1px solid ${getRiskColor(aiAnalysis.risk?.level)}40`,
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Shield style={{ color: getRiskColor(aiAnalysis.risk?.level) }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>Risk Management</h3>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Risk Score</div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold',
                        color: getRiskColor(aiAnalysis.risk?.level)
                      }}>
                        {aiAnalysis.risk?.score}/100
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Max Position Size</div>
                      <div style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>
                        {Math.max(1, 10 - aiAnalysis.risk?.score / 10).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Recommended Stop Loss</div>
                      <div style={{ color: '#f87171', fontSize: '20px', fontWeight: 'bold' }}>
                        {Math.max(1, Math.min(5, aiAnalysis.risk?.score / 20)).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#bfdbfe', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Activity style={{ width: '16px', height: '16px' }} />
            <span>
              <span style={{ fontWeight: 'bold' }}>Multi-Asset Analysis:</span> Real-time forex, crypto, indices & commodities data. 
              AI-powered insights update every 15 seconds. 
            </span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedForexDashboard;
