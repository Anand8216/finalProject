import {v2 as cloudinary} from "cloudinary"

import fs from "fs"
import dotenv from 'dotenv';
dotenv.config();
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env. CLOUDINARY_API_SECRET
});


const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath)return null
        //upload on cloudinARY
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploader
        //console.log("file is uploaded on cloudinary",response.url);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
          }
      
        return response
    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
          }  // remove the locally save temporay file 
        console.log(error);
        return null;
    }

}

console.log(process.env.CLOUDINARY_API_KEY)

export {uploadOnCloudinary};
