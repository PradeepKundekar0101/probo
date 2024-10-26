interface CreateMarketRequest {
    stockSymbol: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    categoryId: string;
  }
export const validateMarketData = (data: CreateMarketRequest): boolean => {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Invalid date format');
    }
  
    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }
  
    if (startTime < new Date()) {
      throw new Error('Start time cannot be in the past');
    }
  
    return true;
  };