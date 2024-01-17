import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

// for registration user
//step-1:get userdetails from frontend
//step2:validation-nt empty
//step-3:check if user already exist:username,email
//step-4:upload them to cloudinary,avatar
//step-5:create user object - create entry in db
//step-6:remove password and refresh token field from response

//step-7:check for usercreation
//step-8:return res;



const generateAcessAndRefreshToken= async(userId)=>{
  try {
   const user = await User.findById(userId)
   const accessToken=user.generateAccessToken()
   const refreshToken=user.generateRefreshToken()

   user.refreshToken = refreshToken  //for backend
   await user.save({ validateBeforeSave: false })

   return {accessToken,refreshToken}
    
  } catch (error) {
    throw new ApiError(500, "something went wrong while generating access and refresh token")
    
  }
}





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
  const existedUser=await User.findOne({
    $or:[{ username },{ email }]  //$or oyeh ek operator hai jo check krta saare fiels of aaray ko
  })  
  
  if(existedUser){
    throw new ApiError(409,"user with username or email exist")
  }


  //avatar ko check krenge

  const avatarLocalPath = req.files?.avatar[0]?.path;  ;  //yeh file ko lene ka tarika

  const coverImagePath=req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar localPath are required")
  }


  // uppload them to clodnary

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImagePath)
  if(!avatar){
    throw new ApiError(500, "Avatar Files are required")
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
    new ApiResponse(201,createdUser,"user Regitered succesfully")
  )
      
})






const loginUser = asyncHandler(async (req, res) =>{
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const {email, username, password} = req.body
  console.log(email);

  if (!username && !email) {
      throw new ApiError(400, "username or email is required")
  }
  
  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")
      
  // }

  const user = await User.findOne({
      $or: [{username}, {email}]
  })

  if (!user) {
      throw new ApiError(404, "User does not exist")
  }


  const isPasswordValid = await user.isPasswordCorrect(password)
  console.log("isPasswordValid:", isPasswordValid);

  if (!isPasswordValid) {
   throw new ApiError(401, "Invalid user credentials")
   }

  const {accessToken, refreshToken} = await generateAcessAndRefreshToken(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

const option={
  httpOnly: true,
  secure:true,
}


return res.status(200)
.cookie("accessToken",accessToken,option)
.cookie("refreshToken",refreshToken,option)
.json(
  new ApiResponse(
    200,
    {
      user:loggedInUser,accessToken,refreshToken
    },
    "user logged in successfully"
  )
)
 

})


  //req.user me user ka acces isliye mil rha kyouki index js me cookie parse use kiya hai
  // cookies ke pass hmne diya hai access sab ka

const logoutUser= asyncHandler(async(req,res)=>{

  
  await User.findByIdAndUpdate(
    req.user._id,
    {
        $set: {
          refreshToken:undefined
        }
    },
    {
      new:true
    }
  )

  const option={
    httpOnly: true,
    secure:true,
  }

  return res
  .status(200)
  .clearCookie("accessToken", option)
  .clearCookie("refreshToken",option)
  .json(new ApiResponse(200, {}, "user Logged out succesfully"))


})


const refreshAccessToken = asyncHandler(async (req,res)=>{
  const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
   if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request")
    
   }

   try {
    const decodedToken=jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
    )
    const user= await User.findById(decodedToken?._id)
 
    if (!user) {
     throw new ApiError(401, "invalid refresh Token")
     
    }
 
    if(incomingRefreshToken !==user?.refreshToken){
     throw new ApiError(401, "refresh Token is expired or used")
    }
 
 
 
    const options={
      httpOnly: true,
      secure:true
    }
 
    const {accessToken, newRefreshToken}=await generateAcessAndRefreshToken(user._id)
 
    return res.status(200)
    .cookie("Access Token", accessToken)
    .cookie("refresh token",  newRefreshToken)
    .json(
     new ApiResponse(
       200,
       {accessToken, refreshToken:newRefreshToken},
       "ACCESS TOKEN REFRESHED"
     )
    )
   } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh Token")
    
   }
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken

}