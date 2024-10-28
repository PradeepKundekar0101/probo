import {createSlice,PayloadAction} from "@reduxjs/toolkit"
import { User } from "@/types/data"
type initialStateType ={
    user:User | null,
    token:string | null
}
const initialState: initialStateType= {
    user:null,
    token:null
}
const authSlice = createSlice({
    name:"auth",
    initialState,
    reducers:{
        login:(state,action:PayloadAction<initialStateType>)=>{
            state.token=action.payload.token
            state.user = action.payload.user
        },
        logout:(state)=>{
            state.token = null;
            state.user = null
        }
    }  
})
export const {login,logout} = authSlice.actions
export default authSlice.reducer