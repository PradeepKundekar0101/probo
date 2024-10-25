import { inrBalances, stockBalances } from "../db";
import { message, publishMessage } from "../services/redis";

export const getInrBalanceAll = async (eventId: string) => {
  try {
    publishMessage(message(200, "Success", inrBalances), eventId);
  } catch (error) {
    console.log(error);
  }
};
export const getInrBalanceByUserId = async (
  userId: string,
  eventId: string
) => {
  try {
    if (!inrBalances[userId])
      return publishMessage(
        message(404, `${userId} does not exist`, null),
        eventId
      );
    publishMessage(message(200, "Success", inrBalances[userId]), eventId);
  } catch (error) {
    console.log(error);
  }
};

export const getStockBalanceAll = async (eventId: string) => {
  try {
    publishMessage(message(200, "Success", stockBalances), eventId);
  } catch (error) {
    console.log(error);
  }
};
export const getStockBalanceByUserId = async (
  userId: string,
  eventId: string
) => {
  try {
    console.log(userId);
    if (!stockBalances[userId])
      return publishMessage(
        message(404, `${userId} does not exist`, null),
        eventId
      );
    publishMessage(message(200, "Success", stockBalances[userId]), eventId);
  } catch (error) {
    console.log(error);
  }
};
