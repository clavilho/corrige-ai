"use client";

import { Button } from "../../ui/button";
import { FcGoogle } from "react-icons/fc";


export function GoogleSignInButton(){

return (

<Button
variant="outline"
className="
w-full
h-12
rounded-xl
gap-3
"
>

<FcGoogle size={20}/>

Continuar com Google

</Button>

)

}