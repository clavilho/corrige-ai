import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";


export async function POST(
  request: Request
) {


  const body = await request.json();


  const {
    email,
    password
  } = body;



  /*
    Aqui futuramente você troca
    pelo Prisma buscando no banco
  */


  const fakeUser = {

    id: "1",

    email: "admin@email.com",

    passwordHash:
      await bcrypt.hash(
        "123456",
        10
      )

  };



  if (
    email !== fakeUser.email
  ) {


    return NextResponse.json(

      {
        message:
        "Usuário não encontrado"
      },

      {
        status:401
      }

    );

  }




  const passwordValid =
    await bcrypt.compare(

      password,

      fakeUser.passwordHash

    );




  if(!passwordValid){


    return NextResponse.json(

      {
        message:
        "Senha inválida"
      },

      {
        status:401
      }

    );

  }




  const response =
    NextResponse.json({

      success:true,

      userId:
      fakeUser.id

    });



  response.cookies.set(

    "session",

    fakeUser.id,

    {
      httpOnly:true,

      secure:
      process.env.NODE_ENV === "production",

      sameSite:"lax",

      maxAge:
      60 * 60 * 24 * 7

    }

  );



  return response;


}