import {S3Client} from '@aws-sdk/client-s3'
import dotenv = require('dotenv');
dotenv.config()
console.log(process.env.AWS_ACCESS_KEY)
console.log(process.env.AWS_ACCESS_KEY_SECRET)
console.log(process.env.BUCKET_REGION)
export const s3Client = new S3Client({
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET || ""
    },
    region: process.env.BUCKET_REGION || ""
})

import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";


import AppError from "../utils/AppError";
  
const bucket = process.env.BUCKET_NAME;
const region = process.env.BUCKET_REGION;
export const getObjectURL = (key: string): string => {
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
  return url;
};

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


export const generatePresignedUrl = async (filename: string, filetype: string, bucketName?: string): Promise<string> => {
  const key = `${filename}`;
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName || process.env.BUCKET_NAME,
      Key: key,
      ContentType: filetype,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); 
    return signedUrl;
  } catch (error: any) {
    console.error("Error generating pre-signed URL:", error);
    throw new AppError(500, "Error generating pre-signed URL for video upload");
  }
};

export const putObjectURL = async (file: Express.Multer.File, name: string,bucketName?:string|undefined) => {
  const destination = `uploads/${name}`;
    try {
      const uploadParams = {
        Bucket: process.env.BUCKET_NAME!,
        Body: file.buffer,
        Key: destination,
        ContentType: file.mimetype,
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
      return destination;
    } catch (error: any) {
      throw new AppError(500, "Error uploading image");
    }
};
  
export const deleteObject = async (key: string) => {
    try {
      const command = new DeleteObjectCommand({
        Key: key,
        Bucket: process.env.BUCKET_NAME,
      });
      await s3Client.send(command);
    } catch (error: any) {
      throw new AppError(500, "Error deleting image");
    }
};