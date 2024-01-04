import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User }  from "../models/user.model.js"

import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser= asyncHandler(async (req,res)=>{
    //data ko liya from frontend
     const {fullName,username,email,password}=req.body
    //   if(fullName===""){
    //     throw new ApiError(400,"full name is required");
    //   }// or doosre tarike se sab ko check kr sakte hai

//va;lidation lagaya dataa pr
    if(
        [fullName,email,username,password].some((field)=>
        field?.trim()==="")

    ){
       throw new ApiError(400,"All field is required")
    }
//db me check krrenge existing user
  const existedUser=User.findOne({
    $or:[{ username },{ email }]  //$or oyeh ek operator hai jo check krta saare fiels of aaray ko
  })  
  
  if(existedUser){
    throw new ApiError(409,"user with username or email exist")
  }


  //avatar ko check krenge

  const avatarLocalPath= req.files?.avatar[0]?.path  ;  //yeh file ko lene ka tarika

  const coverImagePath=req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar Files are required")
  }


  // uppload them to clodnary

  const avatar=await uploadOnCloudinary(avatarLocalPath)
  const coverImage=await uploadOnCloudinary(coverImagePath)
  if(!avatar){
    throw new ApiError(400, "Avatar Files are required")
  }


  //object banao and db me entry nad creaet user

 const user= await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
  })


  //pasword hatao
  const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500, "something went wrong while regestring the user")
  }


  //return res last step


  return res.status(201).json(
    new ApiResponse(200,createdUser,"user Regitered succesfully")
  )
      
})

export {registerUser}