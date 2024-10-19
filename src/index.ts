import app from "./app"
const PORT = process.env.PORT || 8000
app.listen(8000,()=>{
    console.log(`Server running at port ${PORT}`)
})  