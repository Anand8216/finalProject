import dotenv from 'dotenv';
dotenv.config();



import connectDB from "./db/index.js";




connectDB()






// ;(async ()=>{
//     try{
//       await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//       application.on("error",()=>{
//         console.log("ERRR",error)
//         throw error
//       })
//       application.listen(process.env.PORT,()=>{
//         console.log(`App is listening on ${process.env.PORT}`)
//       })

//     }catch(error){
//         console.log("ERROR",error)
//         throw error
//     }
// })()