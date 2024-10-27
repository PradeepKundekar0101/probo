import { google } from 'googleapis';
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
  });
  
  export const getViews = async (videoId: string): Promise<number> => {
    try {
      const response = await youtube.videos.list({
        part: ['statistics'],
        id: [videoId]
      });
  
      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found');
      }
  
      return parseInt(response.data.items[0].statistics?.viewCount || '0');
    } catch (error) {
      console.error('Error fetching video views:', error);
      throw error;
    }
  };
  
  export const getSubs = async (channelId: string): Promise<number> => {
    try {
      const response = await youtube.channels.list({
        part: ['statistics'],
        id: [channelId]
      });
  
      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Channel not found');
      }
  
      return parseInt(response.data.items[0].statistics?.subscriberCount || '0');
    } catch (error) {
      console.error('Error fetching channel subscribers:', error);
      throw error;
    }
  };