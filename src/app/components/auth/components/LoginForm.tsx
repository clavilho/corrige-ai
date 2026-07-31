"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";


const credentials = z.object({

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido"),

  password: z
    .string()
    .min(6, "A senha deve ter ao menos 6 caracteres"),

});


interface LoginFormProps {

  onSuccess: () => void;

}



export function LoginForm({
  onSuccess
}: LoginFormProps) {


  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);



  async function signIn(
    e: React.FormEvent
  ) {

    e.preventDefault();



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



    try {


      const response =
        await fetch(
          "/api/auth/login",
          {

            method:"POST",

            headers:{
              "Content-Type":"application/json"
            },

            body: JSON.stringify(
              parsed.data
            )

          }
        );



      const data =
        await response.json();




      if(!response.ok){

        toast.error(
          data.message ??
          "E-mail ou senha inválidos"
        );

        return;

      }



      toast.success(
        "Login realizado com sucesso"
      );



      onSuccess();



    }
    catch(error){

      toast.error(
        "Erro ao realizar login"
      );

    }
    finally{

      setLoading(false);

    }


  }




  return (

    <form
      onSubmit={signIn}
      className="space-y-6"
    >



      <div className="space-y-2">


        <Label
          htmlFor="login-email"
          className="text-base"
        >

          E-mail

        </Label>



        <Input

          id="login-email"

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
          htmlFor="login-password"
          className="text-base"
        >

          Senha

        </Label>




        <Input

          id="login-password"

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


        Entrar


      </Button>




      <button

        type="button"

        className="
          w-full
          text-slate-500
          hover:text-slate-900
          text-sm
        "

      >

        Esqueci minha senha


      </button>



    </form>

  );

}