"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";



const credentials = z.object({

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido"),


  password: z
    .string()
    .min(6,"A senha deve ter ao menos 6 caracteres"),

});



interface SignupFormProps {

  onSuccess: () => void;

}



export function SignupForm({

  onSuccess

}: SignupFormProps){



  const [name,setName] = useState("");

  const [email,setEmail] = useState("");

  const [password,setPassword] = useState("");

  const [loading,setLoading] = useState(false);




  async function signUp(
    e:React.FormEvent
  ){

    e.preventDefault();



    if(name.trim().length < 2){

      toast.error(
        "Informe seu nome completo"
      );

      return;

    }



    const parsed =
      credentials.safeParse({
        email,
        password
      });



    if(!parsed.success){

      toast.error(
        parsed.error.issues[0].message
      );

      return;

    }




    setLoading(true);



    try{


      const response =
        await fetch(
          "/api/auth/register",
          {

            method:"POST",

            headers:{
              "Content-Type":"application/json"
            },


            body:JSON.stringify({

              name:name.trim(),

              email:parsed.data.email,

              password:parsed.data.password

            })


          }
        );




      const data =
        await response.json();




      if(!response.ok){

        toast.error(
          data.message ??
          "Erro ao criar conta"
        );

        return;

      }




      toast.success(
        "Conta criada com sucesso"
      );



      onSuccess();



    }
    catch{

      toast.error(
        "Erro ao criar conta"
      );

    }
    finally{

      setLoading(false);

    }


  }





  return (

    <form

      onSubmit={signUp}

      className="space-y-6"

    >



      <div className="space-y-2">


        <Label
          htmlFor="name"
          className="text-base"
        >

          Nome do professor

        </Label>



        <Input

          id="name"

          value={name}

          onChange={(e)=>
            setName(e.target.value)
          }


          className="
            h-12
            rounded-xl
            border-slate-200
            shadow-sm
          "

          required

        />

      </div>




      <div className="space-y-2">


        <Label
          htmlFor="signup-email"
          className="text-base"
        >

          E-mail

        </Label>



        <Input

          id="signup-email"

          type="email"

          value={email}

          onChange={(e)=>
            setEmail(e.target.value)
          }


          className="
            h-12
            rounded-xl
            border-slate-200
            shadow-sm
          "

          required

        />


      </div>





      <div className="space-y-2">


        <Label
          htmlFor="signup-password"
          className="text-base"
        >

          Senha

        </Label>



        <Input

          id="signup-password"

          type="password"

          value={password}

          onChange={(e)=>
            setPassword(e.target.value)
          }


          className="
            h-12
            rounded-xl
            border-slate-200
            shadow-sm
          "

          required

        />


      </div>




      <Button

        type="submit"

        disabled={loading}

        className="
          w-full
          h-12
          rounded-xl
          bg-[#006d77]
          hover:bg-[#005c65]
          text-white
          text-base
        "

      >

        {
          loading &&
          <Loader2
            className="
              mr-2
              h-4
              w-4
              animate-spin
            "
          />
        }


        Criar conta


      </Button>


    </form>

  );

}