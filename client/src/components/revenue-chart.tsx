import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { BilingualText } from "@/components/bilingual-text";
import type { PaymentWithGuest } from "@/lib/types";

interface RevenueChartProps {
  payments: PaymentWithGuest[];
}

export function RevenueChart({ payments }: RevenueChartProps) {
  const chartData = useMemo(() => {
    // Get last 7 days
    const days: Array<{
      date: string;
      display: string;
      revenue: number;
      bookings: number;
    }> = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        revenue: 0,
        bookings: 0
      });
    }

    // Calculate revenue for each day
    const paidPayments = payments.filter(p => p.status === 'paid');
    
    paidPayments.forEach(payment => {
      const paymentDate = payment.paidAt ? 
        new Date(payment.paidAt).toISOString().split('T')[0] :
        new Date(payment.createdAt).toISOString().split('T')[0];
      
      const dayData = days.find(d => d.date === paymentDate);
      if (dayData) {
        dayData.revenue += parseFloat(payment.amount);
        dayData.bookings += 1;
      }
    });

    return days;
  }, [payments]);

  const totalRevenue = chartData.reduce((sum, day) => sum + day.revenue, 0);
  const averageRevenue = totalRevenue / chartData.length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">
            ₹{totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 font-telugu">
            <BilingualText english="7-Day Total" telugu="7 రోజుల మొత్తం" />
          </p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            ₹{Math.round(averageRevenue).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 font-telugu">
            <BilingualText english="Daily Average" telugu="రోజువారీ సగటు" />
          </p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">
            {chartData.reduce((sum, day) => sum + day.bookings, 0)}
          </p>
          <p className="text-sm text-gray-600 font-telugu">
            <BilingualText english="Total Bookings" telugu="మొత్తం బుకింగ్‌లు" />
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="display" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              name="Daily Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {totalRevenue === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="font-telugu">
            <BilingualText 
              english="No revenue data available for the last 7 days" 
              telugu="గత 7 రోజుల ఆదాయ డేటా అందుబాటులో లేదు" 
            />
          </p>
        </div>
      )}
    </div>
  );
}