import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface PriceQuantityMap {
  [price: number]: number;
}

interface ChartData {
  yes: PriceQuantityMap;
  no: PriceQuantityMap;
}

interface TransformedData {
  categories: number[];
  yesData: number[];
  noData: number[];
}

interface BidirectionalChartProps {
  data?: ChartData;
}

const BidirectionalChart: React.FC<BidirectionalChartProps> = ({ data }) => {
  const transformData = (): TransformedData => {
    if (!data) return { yesData: [], noData: [], categories: [] };
    
    const yesData: number[] = [];
    const noData: number[] = [];
    const categories = new Set<number>();
    
    Object.keys(data.yes).forEach(price => categories.add(Number(price)));
    Object.keys(data.no).forEach(price => categories.add(Number(price)));
    
    const sortedCategories = Array.from(categories).sort((a, b) => a - b);
    
    sortedCategories.forEach(price => {
      yesData.push(data.yes[price] || 0);
      noData.push(data.no[price] || 0);
    });
    
    return { categories: sortedCategories, yesData, noData };
  };

  const { categories, yesData, noData } = transformData();
  

  const maxValue = Math.max(
    ...yesData.concat(noData)
  );
  
  return (
    <Card className="w-full max-w-3xl mx-auto bg-white py-2">
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-gray-500">QTY AT YES</div>
          <div className="text-sm font-medium">PRICE</div>
          <div className="text-sm font-medium text-gray-500">QTY AT NO</div>
        </div>
        
        {categories.map((price, index) => (
          <div key={price} className="flex items-center py-1 hover:bg-gray-50">

            <div className="w-1/2 flex justify-end items-center pr-2 ">
              <span className="text-sm mr-2">{yesData[index] || ''}</span>
              <div className="relative h-5 flex-grow  border-b border-slate-300 ">
                <div 
                  className="absolute right-0 top-0 h-full   yesBar rounded-tl-lg rounded-bl-lg"
                  style={{
                    width: `${(yesData[index] / maxValue) * 100}%`
                  }}
                />
              </div>
            </div>
            

            <div className="px-4 text-sm font-medium text-center">
              {price.toFixed(1)}
            </div>
            

            <div className="w-1/2 flex items-center pl-2">
              <div className="relative h-8 flex-grow  border-b border-slate-300 ">
                <div 
                  className="absolute left-0 top-0 h-full noBar rounded-tr-lg rounded-br-lg "
                  style={{
                    width: `${(noData[index] / maxValue) * 100}%`
                  }}
                />
              </div>
              <span className="text-sm ml-2">{noData[index] || ''}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default BidirectionalChart;