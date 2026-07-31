"use client";

import { useState } from "react";
import { LoginForm } from "../components/auth/components/LoginForm";
import { SignupForm } from "../components/auth/components/SignupForm";


export default function AuthPage() {

  const [mode, setMode] = useState<"login" | "signup">("login");


  return (

    <main
      className="
        min-h-screen
        bg-[#faf9f5]
        flex
        flex-col
        items-center
        justify-center
        px-4
      "
    >


      {/* Logo */}

      <div
        className="
          flex
          items-center
          gap-3
          mb-8
        "
      >

        <div
          className="
            w-12
            h-12
            rounded-xl
            bg-[#006d77]
            flex
            items-center
            justify-center
            text-white
          "
        >
          🎓
        </div>


        <h1
          className="
            text-2xl
            font-semibold
            text-slate-900
          "
        >
          CorrigeAI
        </h1>


      </div>




      {/* Card */}


      <div
        className="
          w-full
          max-w-xl
          bg-white
          rounded-3xl
          border
          border-slate-200
          shadow-sm
          p-8
        "
      >


        <h2
          className="
            text-xl
            font-semibold
            text-slate-900
          "
        >
          Área do professor
        </h2>


        <p
          className="
            mt-2
            text-slate-500
          "
        >
          Entre ou crie sua conta para começar a corrigir.
        </p>




        {/* Tabs */}


        <div
          className="
            mt-8
            flex
            bg-[#e7f1f1]
            rounded-xl
            p-1
          "
        >

          <button
            onClick={() => setMode("login")}
            className={`
              flex-1
              py-2
              rounded-xl
              transition
              ${
                mode === "login"
                ?
                "bg-white shadow text-slate-900"
                :
                "text-slate-500"
              }
            `}
          >
            Entrar
          </button>



          <button
            onClick={() => setMode("signup")}
            className={`
              flex-1
              py-2
              rounded-xl
              transition
              ${
                mode === "signup"
                ?
                "bg-white shadow text-slate-900"
                :
                "text-slate-500"
              }
            `}
          >
            Cadastrar
          </button>


        </div>



        <div className="mt-8">


          {
            mode === "login"

            ?

            <LoginForm
              onSuccess={() => {}}
            />

            :

            <SignupForm
              onSuccess={() => {}}
            />

          }


        </div>



        {/* Google */}


        <div
          className="
            flex
            items-center
            gap-4
            my-8
          "
        >

          <div className="h-px bg-slate-200 flex-1"/>

          <span className="text-slate-400">
            ou
          </span>

          <div className="h-px bg-slate-200 flex-1"/>

        </div>



        <button
          className="
            w-full
            h-12
            rounded-xl
            border
            border-slate-200
            hover:bg-slate-50
            transition
            text-slate-800
          "
        >

          Continuar com Google

        </button>


      </div>


    </main>

  );
}