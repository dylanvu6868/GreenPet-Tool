import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Percent, ShoppingCart, Package } from 'lucide-react';

const ProjectValuation = () => {
  // Input parameters
  const [initialInvestment, setInitialInvestment] = useState(2000000000);
  const [fixedCosts, setFixedCosts] = useState(15000000);
  const [discountRate, setDiscountRate] = useState(10);
  
  // Product parameters
  const [singlePrice, setSinglePrice] = useState(200000);
  const [comboPrice, setComboPrice] = useState(400000);
  const [totalUnits, setTotalUnits] = useState(200);
  const [singleRatio, setSingleRatio] = useState(60); // % của áo đơn
  
  // Product costs
  const [singleCost, setSingleCost] = useState(80000);
  const [comboCost, setComboCost] = useState(160000);
  
  // Growth parameters
  const [monthlyGrowth, setMonthlyGrowth] = useState(4); // % tăng trưởng/tháng

  // Tính toán doanh thu và lợi nhuận 36 tháng
  const revenueData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 36; i++) {
      const month = (i % 12) + 1;
      const year = 2026 + Math.floor(i / 12);
      
      // Áp dụng tăng trưởng
      const growthFactor = Math.pow(1 + monthlyGrowth / 100, i);
      const currentUnits = Math.round(totalUnits * growthFactor);
      
      // Phân bổ sản phẩm
      const singleUnits = Math.round(currentUnits * singleRatio / 100);
      const comboUnits = currentUnits - singleUnits;
      
      // Tính doanh thu
      const singleRevenue = singleUnits * singlePrice;
      const comboRevenue = comboUnits * comboPrice;
      const totalRevenue = singleRevenue + comboRevenue;
      
      // Tính chi phí và lợi nhuận gộp
      const singleCostTotal = singleUnits * singleCost;
      const comboCostTotal = comboUnits * comboCost;
      const totalCost = singleCostTotal + comboCostTotal;
      const grossProfit = totalRevenue - totalCost;
      
      data.push({
        month,
        year,
        index: i + 1,
        label: `T${i + 1}`,
        singleUnits,
        comboUnits,
        totalUnits: currentUnits,
        singleRevenue,
        comboRevenue,
        revenue: totalRevenue,
        cost: totalCost,
        grossProfit,
        netProfit: grossProfit - fixedCosts
      });
    }
    return data;
  }, [totalUnits, singleRatio, singlePrice, comboPrice, singleCost, comboCost, monthlyGrowth, fixedCosts]);

  // Tính toán các chỉ số tài chính
  const calculations = useMemo(() => {
    // Tính dòng tiền tích lũy
    let cumulativeCashFlow = -initialInvestment;
    const cashFlows = revenueData.map((d, index) => {
      cumulativeCashFlow += d.netProfit;
      return {
        ...d,
        cumulative: cumulativeCashFlow
      };
    });

    // Payback Period
    let paybackMonth = null;
    for (let i = 0; i < cashFlows.length; i++) {
      if (cashFlows[i].cumulative >= 0) {
        if (i > 0) {
          const prevCumulative = cashFlows[i - 1].cumulative;
          const currentProfit = cashFlows[i].netProfit;
          paybackMonth = i + (-prevCumulative / currentProfit);
        } else {
          paybackMonth = i + 1;
        }
        break;
      }
    }

    // NPV Calculation
    let npv = -initialInvestment;
    revenueData.forEach((d, index) => {
      const discountFactor = Math.pow(1 + discountRate / 100 / 12, index + 1);
      npv += d.netProfit / discountFactor;
    });

    // IRR Calculation
    const calculateNPVForRate = (rate) => {
      let value = -initialInvestment;
      revenueData.forEach((d, index) => {
        value += d.netProfit / Math.pow(1 + rate / 12, index + 1);
      });
      return value;
    };

    let irr = 0.1;
    for (let i = 0; i < 100; i++) {
      const npvAtRate = calculateNPVForRate(irr);
      const npvAtRatePlus = calculateNPVForRate(irr + 0.0001);
      const derivative = (npvAtRatePlus - npvAtRate) / 0.0001;
      const newIrr = irr - npvAtRate / derivative;
      if (Math.abs(newIrr - irr) < 0.0001) break;
      irr = newIrr;
    }
    irr = irr * 100;

    // ROI
    const totalNetProfit = revenueData.reduce((sum, d) => sum + d.netProfit, 0);
    const roi = (totalNetProfit / initialInvestment) * 100;

    // BEP
    const avgRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0) / revenueData.length;
    const avgNetProfit = revenueData.reduce((sum, d) => sum + d.netProfit, 0) / revenueData.length;
    const profitMargin = avgNetProfit / avgRevenue;
    const bepRevenue = fixedCosts / profitMargin;
    const bepMonths = avgNetProfit > 0 ? initialInvestment / avgNetProfit : null;

    return {
      cashFlows,
      paybackMonth,
      npv,
      irr,
      roi,
      bepRevenue,
      bepMonths,
      totalRevenue: revenueData.reduce((sum, d) => sum + d.revenue, 0),
      totalProfit: totalNetProfit,
      avgMonthlyRevenue: avgRevenue,
      avgMonthlyProfit: avgNetProfit,
      totalUnits: revenueData.reduce((sum, d) => sum + d.totalUnits, 0)
    };
  }, [revenueData, initialInvestment, discountRate, fixedCosts]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Thẩm Định Dự Án Kinh Doanh GreenPet</h1>
        <p className="text-gray-600 mb-8">Nhập số liệu → Tự động tính toán NPV, IRR, ROI, BEP</p>
        
        {/* Thông số đầu tư */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Thông Số Đầu Tư</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vốn Đầu Tư Ban Đầu (đ)
              </label>
              <input
                type="number"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
                step="100000000"
              />
              <p className="text-xs text-gray-600 mt-1">{formatCurrency(initialInvestment)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chi Phí Cố Định/Tháng (đ)
              </label>
              <input
                type="number"
                value={fixedCosts}
                onChange={(e) => setFixedCosts(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-green-300 rounded-md focus:ring-2 focus:ring-green-500"
                step="1000000"
              />
              <p className="text-xs text-gray-600 mt-1">{formatCurrency(fixedCosts)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tỷ Suất Chiết Khấu (%/năm)
              </label>
              <input
                type="number"
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                step="0.5"
              />
              <p className="text-xs text-gray-600 mt-1">{formatPercent(discountRate)} / năm</p>
            </div>
          </div>
        </div>

        {/* Thông số sản phẩm */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">👕 Thông Số Sản Phẩm</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giá Áo Đơn (đ)
              </label>
              <input
                type="number"
                value={singlePrice}
                onChange={(e) => setSinglePrice(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-green-300 rounded-md focus:ring-2 focus:ring-green-500"
                step="10000"
              />
              <p className="text-xs text-gray-600 mt-1">{formatCurrency(singlePrice)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chi Phí Áo Đơn (đ)
              </label>
              <input
                type="number"
                value={singleCost}
                onChange={(e) => setSingleCost(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-orange-300 rounded-md focus:ring-2 focus:ring-orange-500"
                step="10000"
              />
              <p className="text-xs text-gray-600 mt-1">{formatCurrency(singleCost)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giá Combo (đ)
              </label>
              <input
                type="number"
                value={comboPrice}
                onChange={(e) => setComboPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
                step="10000"
              />
              <p className="text-xs text-gray-600 mt-1">{formatCurrency(comboPrice)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chi Phí Combo (đ)
              </label>
              <input
                type="number"
                value={comboCost}
                onChange={(e) => setComboCost(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-red-300 rounded-md focus:ring-2 focus:ring-red-500"
                step="10000"
              />
              <p className="text-xs text-gray-600 mt-1">{formatCurrency(comboCost)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số Lượng Bán/Tháng (chiếc)
              </label>
              <input
                type="number"
                value={totalUnits}
                onChange={(e) => setTotalUnits(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                step="10"
              />
              <p className="text-xs text-gray-600 mt-1">{formatNumber(totalUnits)} chiếc</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tỷ Lệ Áo Đơn (%)
              </label>
              <input
                type="number"
                value={singleRatio}
                onChange={(e) => setSingleRatio(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full px-3 py-2 border-2 border-pink-300 rounded-md focus:ring-2 focus:ring-pink-500"
                step="5"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-600 mt-1">Combo: {100 - singleRatio}%</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tăng Trưởng/Tháng (%)
              </label>
              <input
                type="number"
                value={monthlyGrowth}
                onChange={(e) => setMonthlyGrowth(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                step="0.5"
              />
              <p className="text-xs text-gray-600 mt-1">{formatPercent(monthlyGrowth)} / tháng</p>
            </div>
          </div>
        </div>

        {/* Ví dụ tháng đầu */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-gray-800 mb-2">Ví Dụ Tháng Đầu:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Áo đơn:</p>
              <p className="font-bold">{formatNumber(revenueData[0].singleUnits)} × {formatCurrency(singlePrice)}</p>
            </div>
            <div>
              <p className="text-gray-600">Combo:</p>
              <p className="font-bold">{formatNumber(revenueData[0].comboUnits)} × {formatCurrency(comboPrice)}</p>
            </div>
            <div>
              <p className="text-gray-600">Doanh thu:</p>
              <p className="font-bold text-green-600">{formatCurrency(revenueData[0].revenue)}</p>
            </div>
            <div>
              <p className="text-gray-600">Lợi nhuận ròng:</p>
              <p className="font-bold text-blue-600">{formatCurrency(revenueData[0].netProfit)}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8" />
              <span className="text-sm font-medium opacity-90">NPV</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(calculations.npv)}</p>
            <p className="text-xs opacity-80 mt-1">
              {calculations.npv > 0 ? '✓ Khả thi' : '✗ Không khả thi'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-8 h-8" />
              <span className="text-sm font-medium opacity-90">IRR</span>
            </div>
            <p className="text-2xl font-bold">{formatPercent(calculations.irr)}</p>
            <p className="text-xs opacity-80 mt-1">
              {calculations.irr > discountRate ? '✓ Cao hơn chiết khấu' : '✗ Thấp hơn chiết khấu'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8" />
              <span className="text-sm font-medium opacity-90">ROI</span>
            </div>
            <p className="text-2xl font-bold">{formatPercent(calculations.roi)}</p>
            <p className="text-xs opacity-80 mt-1">Sau 36 tháng</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8" />
              <span className="text-sm font-medium opacity-90">Hoàn Vốn</span>
            </div>
            <p className="text-2xl font-bold">
              {calculations.paybackMonth ? `${calculations.paybackMonth.toFixed(1)}` : 'N/A'}
            </p>
            <p className="text-xs opacity-80 mt-1">Tháng</p>
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="mb-8">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Dòng Tiền Tích Lũy</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={calculations.cashFlows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="cumulative" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" strokeWidth={0} name="Dòng tiền tích lũy" />
              <Line type="monotone" dataKey="cumulative" stroke="#1e40af" strokeWidth={3} name="Dòng tiền" dot={false} />
              <Bar dataKey="netProfit" fill="#10b981" name="Lợi nhuận ròng/tháng" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue & Units Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="font-bold text-lg text-gray-800 mb-4">📈 Doanh Thu 36 Tháng</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={calculations.cashFlows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="singleRevenue" stackId="a" fill="#06b6d4" name="DT Áo đơn" />
                <Bar dataKey="comboRevenue" stackId="a" fill="#8b5cf6" name="DT Combo" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-800 mb-4">Số Lượng Bán 36 Tháng</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={calculations.cashFlows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="singleUnits" stackId="a" fill="#f59e0b" name="Áo đơn" />
                <Bar dataKey="comboUnits" stackId="a" fill="#ec4899" name="Combo" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BEP Information */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-8">
          <h3 className="font-bold text-lg text-gray-800 mb-3">Điểm Hòa Vốn (BEP)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Doanh thu hòa vốn/tháng:</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(calculations.bepRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Thời gian hòa vốn toàn bộ:</p>
              <p className="text-xl font-bold text-gray-800">
                {calculations.bepMonths ? `${calculations.bepMonths.toFixed(1)} tháng` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Tổng Kết 36 Tháng</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tổng doanh thu:</p>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(calculations.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng lợi nhuận:</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(calculations.totalProfit)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">TB doanh thu/tháng:</p>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(calculations.avgMonthlyRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng số áo bán:</p>
              <p className="text-lg font-bold text-blue-600">{formatNumber(calculations.totalUnits)} chiếc</p>
            </div>
          </div>
        </div>

        {/* Evaluation */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h3 className="font-bold text-lg text-gray-800 mb-3">Đánh Giá Dự Án</h3>
          <div className="space-y-2">
            <p className={`flex items-center ${calculations.npv > 0 ? 'text-green-700' : 'text-red-700'}`}>
              <span className="mr-2 text-xl">{calculations.npv > 0 ? '✓' : '✗'}</span>
              <strong>NPV:</strong>&nbsp;{calculations.npv > 0 ? 'Dương - Dự án tạo giá trị' : 'Âm - Cần xem xét lại'}
            </p>
            <p className={`flex items-center ${calculations.irr > discountRate ? 'text-green-700' : 'text-red-700'}`}>
              <span className="mr-2 text-xl">{calculations.irr > discountRate ? '✓' : '✗'}</span>
              <strong>IRR:</strong>&nbsp;{calculations.irr > discountRate ? `formatPercent(calculations.irr)>{formatPercent(calculations.irr)} > {formatPercent(discountRate)} - Hiệu quả cao` : 'Thấp hơn tỷ suất chiết khấu'}
            </p>
            <p className={`flex items-center ${calculations.roi > 0 ? 'text-green-700' : 'text-red-700'}`}>
              <span className="mr-2 text-xl">{calculations.roi > 0 ? '✓' : '✗'}</span>
              <strong>ROI:</strong>&nbsp;{formatPercent(calculations.roi)} sau 36 tháng
            </p>
            <p className={`flex items-center ${calculations.paybackMonth && calculations.paybackMonth < 36 ? 'text-green-700' : 'text-orange-700'}`}>
              <span className="mr-2 text-xl">{calculations.paybackMonth && calculations.paybackMonth < 36 ? '✓' : '⚠'}</span>
              <strong>Hoàn vốn:</strong>&nbsp;{calculations.paybackMonth ? `Tháng ${calculations.paybackMonth.toFixed(1)}` : 'Chưa hoàn vốn trong 36 tháng'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectValuation;
