import React, {ReactNode, CSSProperties} from 'react'
import './customButton.css'

interface CustomButtonProps{
    children: ReactNode,
    onClick: ()=> void,
    style?: CSSProperties
}
export const CustomButton: React.FC<CustomButtonProps>=({children, onClick, style})=>{

    return(
        <button className='btn' onClick={onClick} style={style}>
            {children}
        </button>
    )

}
